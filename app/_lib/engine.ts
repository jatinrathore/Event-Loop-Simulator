/**
 * SimulationEngine — corrected Event Loop phase model
 *
 * PHASE DEFINITION (matches actual JavaScript behavior):
 *   Phase = one outer Event Loop iteration
 *   ├─ Microtask drain session  →  1 phase  (ALL microtasks in a batch = 1 phase)
 *   └─ One macrotask            →  1 phase
 *
 * Example: 10 microtasks + 20 macrotasks = 21 phases
 *   Phase  1: Drain all 10 microtasks
 *   Phase  2: Execute macrotask #1
 *   ...
 *   Phase 21: Execute macrotask #20
 *
 * KEY FIX vs prior version:
 *   complete-microtask does NOT route back through check-queues when more
 *   microtasks exist. It stays in the drain path (start-microtask) WITHOUT
 *   incrementing the phase counter, preserving the "one drain = one phase" rule.
 *   The phase counter is ONLY incremented in check-queues when entering a NEW
 *   drain session or a new macrotask.
 */

import { BASE_TIMING, Task } from "./types";

// ─── Store slice the engine reads on every tick ────────────────────────────────

export type EngineStore = {
  microtaskQueue: Task[];
  macrotaskQueue: Task[];
  callStack: Task[];
  currentTask: Task | null;
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  currentPhase: string;
  _setPhase: (phase: any) => void;
  _setRunning: (v: boolean) => void;
  _setPaused: (v: boolean) => void;
  _setCurrentTask: (t: Task | null) => void;
  _updateTaskStatus: (id: string, status: any) => void;
  _moveTaskToCallStack: (t: Task) => void;
  _removeFromMicrotaskQueue: (id: string) => void;
  _removeFromMacrotaskQueue: (id: string) => void;
  _removeFromCallStack: (id: string) => void;
  _completeTask: (t: Task) => void;
  _advancePhase: (kind: "microtask-drain" | "macrotask", label: string) => void;
  _updateActivePhaseTaskCount: (delta: number) => void;
  _completeActivePhase: () => void;
  _pushLog: (msg: string, type: any) => void;
  _pushTick: (taskId: string, label: string, type: any, event: string) => void;
};

// ─── Engine internal state machine ────────────────────────────────────────────

type EnginePhase =
  | "check-queues"
  // microtask drain path (all within ONE event loop phase)
  | "start-microtask"
  | "animate-microtask-to-loop"
  | "animate-microtask-to-stack"
  | "execute-microtask"
  | "complete-microtask"
  // macrotask path (each is ONE event loop phase)
  | "start-macrotask"
  | "animate-macrotask-to-loop"
  | "animate-macrotask-to-stack"
  | "execute-macrotask"
  | "complete-macrotask"
  | "done";

export class SimulationEngine {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private getState: (() => EngineStore) | null = null;
  private enginePhase: EnginePhase = "check-queues";
  private activeTask: Task | null = null;
  private stepMode: boolean = false;
  private stepComplete: boolean = false;
  private destroyed: boolean = false;
  /** True while draining microtasks in a single phase session */
  private inMicrotaskDrain: boolean = false;

  // ─── Public API ─────────────────────────────────────────────────────────────

  start(getState: () => EngineStore) {
    this.stop();
    this.getState = getState;
    this.enginePhase = "check-queues";
    this.stepMode = false;
    this.stepComplete = false;
    this.destroyed = false;
    this.activeTask = null;
    this.inMicrotaskDrain = false;
    this.scheduleNext(100);
  }

  step(getState: () => EngineStore) {
    this.getState = getState;
    this.stepMode = true;
    this.stepComplete = false;
    this.destroyed = false;
    this.tick();
  }

  stop() {
    this.destroyed = true;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private s(): EngineStore {
    return this.getState!();
  }

  private delay(base: number): number {
    return Math.round(base / Math.max(0.01, this.s().speed));
  }

  private scheduleNext(ms: number = 50) {
    if (this.destroyed) return;
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => this.tick(), ms);
  }

  private tick() {
    if (this.destroyed || !this.getState) return;
    const { isPaused } = this.s();
    if (isPaused && !this.stepMode) {
      this.scheduleNext(100);
      return;
    }
    this.processPhase();
  }

  // ─── State machine ──────────────────────────────────────────────────────────

  private processPhase() {
    if (this.destroyed) return;
    const s = this.s();

    switch (this.enginePhase) {

      // ── DECISION POINT ───────────────────────────────────────────────────────
      case "check-queues": {
        if (s.callStack.length > 0) {
          this.scheduleNext(100);
          return;
        }

        if (s.microtaskQueue.length > 0) {
          // ── NEW microtask-drain phase ──────────────────────────────────────
          // This is a fresh drain session (not a continuation) → advance phase
          const batchSize = s.microtaskQueue.length;
          s._advancePhase("microtask-drain", `Drain ${batchSize} Microtask${batchSize > 1 ? "s" : ""}`);
          s._setPhase("draining-microtasks");
          s._pushLog(`[Phase ${this.nextPhaseNum()}] Draining Microtask Queue (${batchSize} task${batchSize > 1 ? "s" : ""})`, "system");
          this.inMicrotaskDrain = true;
          this.enginePhase = "start-microtask";
          this.scheduleNext(50);
          return;
        }

        if (s.macrotaskQueue.length > 0) {
          // ── NEW macrotask phase ────────────────────────────────────────────
          const task = s.macrotaskQueue[0];
          s._advancePhase("macrotask", task.label);
          s._setPhase("executing-macrotask");
          this.enginePhase = "start-macrotask";
          this.scheduleNext(50);
          return;
        }

        // All done
        this.enginePhase = "done";
        this.scheduleNext(50);
        return;
      }

      // ── MICROTASK LIFECYCLE (within ONE phase) ───────────────────────────────
      case "start-microtask": {
        const task = s.microtaskQueue[0];
        if (!task) {
          // Queue was emptied (maybe dynamic add removed), end drain
          this.inMicrotaskDrain = false;
          s._completeActivePhase();
          this.enginePhase = "check-queues";
          this.scheduleNext(50);
          return;
        }
        this.activeTask = task;
        s._updateTaskStatus(task.id, "moving-to-event-loop");
        s._pushLog(`[Micro] ${task.label} → Event Loop`, "micro");
        s._pushTick(task.id, task.label, "microtask", "entered Event Loop");
        this.enginePhase = "animate-microtask-to-loop";
        this.scheduleNext(this.delay(BASE_TIMING.queueToEventLoop));
        this.completeStepIfNeeded();
        return;
      }

      case "animate-microtask-to-loop": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        s._updateTaskStatus(task.id, "event-loop");
        s._removeFromMicrotaskQueue(task.id);
        s._updateTaskStatus(task.id, "moving-to-stack");
        s._pushLog(`[Micro] ${task.label} → Call Stack`, "micro");
        s._pushTick(task.id, task.label, "microtask", "entered Call Stack");
        this.enginePhase = "animate-microtask-to-stack";
        this.scheduleNext(this.delay(BASE_TIMING.eventLoopToStack));
        this.completeStepIfNeeded();
        return;
      }

      case "animate-microtask-to-stack": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        s._moveTaskToCallStack(task);
        s._pushLog(`[Micro] ${task.label} Executing…`, "micro");
        s._pushTick(task.id, task.label, "microtask", "executing");
        this.enginePhase = "execute-microtask";
        this.scheduleNext(this.delay(BASE_TIMING.executing));
        this.completeStepIfNeeded();
        return;
      }

      case "execute-microtask": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        s._completeTask(task);
        s._updateActivePhaseTaskCount(1);
        s._pushLog(`[Micro] ${task.label} ✓ Completed`, "micro");
        s._pushTick(task.id, task.label, "microtask", "completed");
        this.enginePhase = "complete-microtask";
        this.scheduleNext(this.delay(BASE_TIMING.completing));
        this.completeStepIfNeeded();
        return;
      }

      case "complete-microtask": {
        this.activeTask = null;
        const freshState = this.s();

        if (freshState.microtaskQueue.length > 0) {
          // ── CRITICAL: continue the SAME drain phase — NO phase increment ──
          // Rule 2 + Rule 6: all microtasks (including dynamically added ones
          // from within this drain session) run in one uninterrupted phase.
          this.enginePhase = "start-microtask";
          this.scheduleNext(30);
        } else {
          // Drain complete — close this phase, go back to decision point
          this.inMicrotaskDrain = false;
          s._completeActivePhase();
          this.enginePhase = "check-queues";
          this.scheduleNext(50);
        }
        return;
      }

      // ── MACROTASK LIFECYCLE (each is its own phase) ──────────────────────────
      case "start-macrotask": {
        // Safety: never run macrotask while microtask queue has items
        if (s.microtaskQueue.length > 0) {
          // Microtasks appeared (dynamically) — pivot to drain them as a new phase
          this.enginePhase = "check-queues";
          this.scheduleNext(50);
          return;
        }
        const task = s.macrotaskQueue[0];
        if (!task) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        this.activeTask = task;
        s._updateTaskStatus(task.id, "moving-to-event-loop");
        s._pushLog(`[Macro] ${task.label} → Event Loop`, "macro");
        s._pushTick(task.id, task.label, "macrotask", "entered Event Loop");
        this.enginePhase = "animate-macrotask-to-loop";
        this.scheduleNext(this.delay(BASE_TIMING.queueToEventLoop));
        this.completeStepIfNeeded();
        return;
      }

      case "animate-macrotask-to-loop": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        s._updateTaskStatus(task.id, "event-loop");
        s._removeFromMacrotaskQueue(task.id);
        s._updateTaskStatus(task.id, "moving-to-stack");
        s._pushLog(`[Macro] ${task.label} → Call Stack`, "macro");
        s._pushTick(task.id, task.label, "macrotask", "entered Call Stack");
        this.enginePhase = "animate-macrotask-to-stack";
        this.scheduleNext(this.delay(BASE_TIMING.eventLoopToStack));
        this.completeStepIfNeeded();
        return;
      }

      case "animate-macrotask-to-stack": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        s._moveTaskToCallStack(task);
        s._pushLog(`[Macro] ${task.label} Executing…`, "macro");
        s._pushTick(task.id, task.label, "macrotask", "executing");
        this.enginePhase = "execute-macrotask";
        this.scheduleNext(this.delay(BASE_TIMING.executing));
        this.completeStepIfNeeded();
        return;
      }

      case "execute-macrotask": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        s._completeTask(task);
        s._updateActivePhaseTaskCount(1);
        s._pushLog(`[Macro] ${task.label} ✓ Completed`, "macro");
        s._pushTick(task.id, task.label, "macrotask", "completed");
        this.enginePhase = "complete-macrotask";
        this.scheduleNext(this.delay(BASE_TIMING.completing));
        this.completeStepIfNeeded();
        return;
      }

      case "complete-macrotask": {
        this.activeTask = null;
        s._completeActivePhase();
        // Rule 3: after macrotask, go back to check-queues to re-check for
        // any microtasks that may have been enqueued during macrotask execution.
        this.enginePhase = "check-queues";
        this.scheduleNext(50);
        return;
      }

      // ── DONE ────────────────────────────────────────────────────────────────
      case "done": {
        const st = this.s();
        st._setPhase("idle");
        st._setRunning(false);
        st._pushLog("[Done] All tasks completed. Event Loop is now idle.", "system");
        this.stop();
        return;
      }
    }
  }

  private nextPhaseNum(): number {
    // Read the current phase number from store (already incremented by _advancePhase)
    // We can't access store directly here without the getter, so use s()
    return this.s().currentPhase === "draining-microtasks"
      ? -1 // placeholder; actual number is in store
      : -1;
  }

  private completeStepIfNeeded() {
    if (this.stepMode && !this.stepComplete) {
      this.stepComplete = true;
      setTimeout(() => {
        if (!this.destroyed && this.getState) {
          this.s()._setPaused(true);
          this.stepMode = false;
        }
      }, 50);
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const simulationEngine = new SimulationEngine();
