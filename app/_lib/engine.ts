/**
 * SimulationEngine
 *
 * Pure simulation logic — no React imports, no UI side-effects.
 * Reads and mutates state exclusively via a getState() function supplied at startup.
 *
 * Future phases (AST parser → runtime planner) can inject tasks by calling
 * store.addMicrotask() / store.addMacrotask() programmatically, and this
 * engine will pick them up without any modification.
 *
 * Architecture:
 *   User Action → store.startSimulation()
 *   Engine.start(getState) → setInterval → processStep()
 *   processStep() → getState() → reads live state → mutates via store actions
 *   UI → reacts to Zustand state changes
 */

import { BASE_TIMING, Task } from "./types";

// ─── Store slice the engine needs (read from getState() each tick) ─────────────

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
  _advanceIteration: () => void;
  _pushLog: (msg: string, type: any) => void;
  _pushTick: (taskId: string, label: string, type: any, event: string) => void;
};

// ─── Engine state machine phases ─────────────────────────────────────────────

type EnginePhase =
  | "check-queues"
  | "start-microtask"
  | "animate-microtask-to-loop"
  | "animate-microtask-to-stack"
  | "execute-microtask"
  | "complete-microtask"
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

  /** Start continuous simulation */
  start(getState: () => EngineStore) {
    this.stop(); // clear any previous run
    this.getState = getState;
    this.enginePhase = "check-queues";
    this.stepMode = false;
    this.stepComplete = false;
    this.destroyed = false;
    this.activeTask = null;
    this.scheduleNext(100);
  }

  /** Execute exactly one micro-phase step, then pause */
  step(getState: () => EngineStore) {
    this.getState = getState;
    this.stepMode = true;
    this.stepComplete = false;
    this.destroyed = false;
    // Execute immediately (no setTimeout)
    this.tick();
  }

  /** Stop the engine */
  stop() {
    this.destroyed = true;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private s(): EngineStore {
    return this.getState!();
  }

  private getDelay(base: number): number {
    return Math.round(base / (this.s().speed || 1));
  }

  private scheduleNext(delay: number = 50) {
    if (this.destroyed) return;
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => this.tick(), delay);
  }

  private tick() {
    if (this.destroyed || !this.getState) return;

    const state = this.s();

    // Respect pause (unless we're in step mode — step mode temporarily unpauses)
    if (state.isPaused && !this.stepMode) {
      this.scheduleNext(100);
      return;
    }

    this.processPhase();
  }

  private processPhase() {
    if (this.destroyed) return;
    const s = this.s();

    switch (this.enginePhase) {
      // ── CHECK: decide what to do next ──────────────────────────────────────
      case "check-queues": {
        if (s.callStack.length > 0) {
          // Stack occupied — wait
          this.scheduleNext(100);
          return;
        }

        if (s.microtaskQueue.length > 0) {
          // Drain next microtask
          this.enginePhase = "start-microtask";
          s._setPhase("draining-microtasks");
          this.scheduleNext(50);
          return;
        }

        if (s.macrotaskQueue.length > 0) {
          // Execute next macrotask
          this.enginePhase = "start-macrotask";
          s._setPhase("executing-macrotask");
          this.scheduleNext(50);
          return;
        }

        // All queues empty — done
        this.enginePhase = "done";
        this.scheduleNext(50);
        return;
      }

      // ── MICROTASK lifecycle ────────────────────────────────────────────────
      case "start-microtask": {
        const task = s.microtaskQueue[0];
        if (!task) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        this.activeTask = task;
        s._updateTaskStatus(task.id, "moving-to-event-loop");
        s._pushLog(`[Micro] ${task.label} → Event Loop`, "micro");
        s._pushTick(task.id, task.label, "microtask", "entered Event Loop");
        this.enginePhase = "animate-microtask-to-loop";
        this.scheduleNext(this.getDelay(BASE_TIMING.queueToEventLoop));
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
        this.scheduleNext(this.getDelay(BASE_TIMING.eventLoopToStack));
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
        this.scheduleNext(this.getDelay(BASE_TIMING.executing));
        this.completeStepIfNeeded();
        return;
      }

      case "execute-microtask": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        s._completeTask(task);
        s._pushLog(`[Micro] ${task.label} ✓ Completed`, "micro");
        s._pushTick(task.id, task.label, "microtask", "completed");
        // Rule 2: After microtask, check for more microtasks FIRST
        this.enginePhase = "complete-microtask";
        this.scheduleNext(this.getDelay(BASE_TIMING.completing));
        this.completeStepIfNeeded();
        return;
      }

      case "complete-microtask": {
        this.activeTask = null;
        // Always check queues — microtasks may have been dynamically added
        this.enginePhase = "check-queues";
        this.scheduleNext(50);
        return;
      }

      // ── MACROTASK lifecycle ────────────────────────────────────────────────
      case "start-macrotask": {
        // Rule 4: Never run macrotask while microtask exists
        if (s.microtaskQueue.length > 0) {
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
        this.scheduleNext(this.getDelay(BASE_TIMING.queueToEventLoop));
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
        this.scheduleNext(this.getDelay(BASE_TIMING.eventLoopToStack));
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
        this.scheduleNext(this.getDelay(BASE_TIMING.executing));
        this.completeStepIfNeeded();
        return;
      }

      case "execute-macrotask": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        s._completeTask(task);
        s._pushLog(`[Macro] ${task.label} ✓ Completed`, "macro");
        s._pushTick(task.id, task.label, "macrotask", "completed");
        s._advanceIteration();
        this.enginePhase = "complete-macrotask";
        this.scheduleNext(this.getDelay(BASE_TIMING.completing));
        this.completeStepIfNeeded();
        return;
      }

      case "complete-macrotask": {
        this.activeTask = null;
        // Rule 3: After macrotask, check microtask queue again
        this.enginePhase = "check-queues";
        this.scheduleNext(50);
        return;
      }

      // ── DONE ──────────────────────────────────────────────────────────────
      case "done": {
        const st = this.s();
        st._setPhase("idle");
        st._setRunning(false);
        st._pushLog("[Done] All tasks completed. Event Loop idle.", "system");
        this.stop();
        return;
      }
    }
  }

  private completeStepIfNeeded() {
    if (this.stepMode && !this.stepComplete) {
      this.stepComplete = true;
      // Re-pause after this step completes
      setTimeout(() => {
        if (!this.destroyed && this.getState) {
          this.s()._setPaused(true);
          this.stepMode = false;
        }
      }, 50);
    }
  }
}

// ─── Singleton engine instance ────────────────────────────────────────────────

export const simulationEngine = new SimulationEngine();
