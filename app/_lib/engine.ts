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
  completedTasks: Task[];
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  currentPhase: string;
  currentPhaseNumber: number;
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
  _advancePhase: (kind: "global-script" | "microtask-drain" | "macrotask", label: string) => void;
  _updateActivePhaseTaskCount: (delta: number) => void;
  _completeActivePhase: () => void;
  _pushLog: (msg: string, type: any) => void;
  _pushTick: (taskId: string, label: string, type: any, event: string) => void;
  _setEducationalText?: (text: string) => void;
  _addScheduledTask?: (task: Task) => void;
  _addConsoleLogs?: (logs: string[]) => void;
};

// ─── Engine internal state machine ────────────────────────────────────────────

type EnginePhase =
  | "check-queues"
  // sync task path
  | "execute-sync-task"
  | "complete-sync-task"
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

    // Update educational text for the current phase
    this.updateEducationalText(this.enginePhase, this.activeTask);

    switch (this.enginePhase) {

      // ── DECISION POINT ───────────────────────────────────────────────────────
      case "check-queues": {
        if (s.callStack.length > 0) {
          // If we have a synchronous main() task preloaded, execute it first
          if (s.callStack[0].id === "sync-task-main" || s.callStack[0].id === "global-script") {
            this.activeTask = s.callStack[0];
            s._advancePhase("global-script", "Global Script");
            s._setPhase("executing-task");
            this.enginePhase = "execute-sync-task";
            this.scheduleNext(this.delay(BASE_TIMING.executing));
            return;
          }
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

      // ── SYNC TASK LIFECYCLE ──────────────────────────────────────────────────
      case "execute-sync-task": {
        if (!this.activeTask) { this.enginePhase = "check-queues"; this.scheduleNext(50); return; }
        const task = this.activeTask;
        if (task.consoleLogs && task.consoleLogs.length > 0 && s._addConsoleLogs) {
          s._addConsoleLogs(task.consoleLogs);
        }

        if (task.executionTicks && task.executionTicks.length > 0) {
          for (const tick of task.executionTicks) {
            s._pushTick(task.id, task.label, task.type, tick.event);
            s._pushLog(`[Call Stack] ${tick.event}`, "system");
          }
        }

        this.scheduleChildIfNeeded(task);
        s._completeTask(task);
        s._pushLog(`[Stack] ${task.label} completed. Call Stack is now empty.`, "system");
        s._pushTick(task.id, task.label, "macrotask", "completed");
        this.enginePhase = "complete-sync-task";
        this.scheduleNext(this.delay(BASE_TIMING.completing));
        this.completeStepIfNeeded();
        return;
      }

      case "complete-sync-task": {
        this.activeTask = null;
        s._completeActivePhase();
        this.enginePhase = "check-queues";
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
        if (task.consoleLogs && task.consoleLogs.length > 0 && s._addConsoleLogs) {
          s._addConsoleLogs(task.consoleLogs);
        }

        if (task.executionTicks && task.executionTicks.length > 0) {
          for (const tick of task.executionTicks) {
            s._pushTick(task.id, task.label, task.type, tick.event);
            s._pushLog(`[Call Stack] ${tick.event}`, "system");
          }
        }

        this.scheduleChildIfNeeded(task);
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
        if (task.consoleLogs && task.consoleLogs.length > 0 && s._addConsoleLogs) {
          s._addConsoleLogs(task.consoleLogs);
        }

        if (task.executionTicks && task.executionTicks.length > 0) {
          for (const tick of task.executionTicks) {
            s._pushTick(task.id, task.label, task.type, tick.event);
            s._pushLog(`[Call Stack] ${tick.event}`, "system");
          }
        }

        this.scheduleChildIfNeeded(task);
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
    return this.s().currentPhaseNumber;
  }

  private scheduleChildIfNeeded(task: Task) {
    const s = this.s();
    if (!s._addScheduledTask) return; // safeguard

    // If pre-planned scheduledTasks are present, prioritize them
    if (task.scheduledTasks && task.scheduledTasks.length > 0) {
      for (const child of task.scheduledTasks) {
        const childTask: Task = {
          ...child,
          id: child.id || `${task.id}-child-${Date.now()}-${Math.random()}`,
          status: "queued",
          createdAt: Date.now(),
          parentId: task.id,
        };
        s._addScheduledTask(childTask);
      }
      return;
    }

    if (!task.schedules) return;
    const childType = task.schedules.type;
    const isMicro = childType === "microtask";
    const prefix = isMicro ? "M" : "T";
    
    // Calculate next order label
    const activeCount = isMicro ? s.microtaskQueue.length : s.macrotaskQueue.length;
    const completedCount = s.completedTasks.filter(t => t.type === childType).length;
    const order = activeCount + completedCount + 1;

    const label = isMicro
      ? `queueMicrotask() (${prefix}${order})`
      : `setTimeout() (${prefix}${order})`;

    const childTask: Task = {
      id: `${task.id}-child-${Date.now()}`,
      label,
      type: childType,
      status: "queued",
      createdAt: Date.now(),
      parentId: task.id,
    };

    s._addScheduledTask(childTask);
  }

  private updateEducationalText(phase: EnginePhase, task: Task | null = null) {
    const s = this.s();
    if (!s._setEducationalText) return;

    if (s.callStack.length > 0 && s.callStack[0].id === "sync-task-main") {
      s._setEducationalText("Executing synchronous main thread code on the Call Stack. All asynchronous queues are blocked until the stack is completely empty.");
      return;
    }

    switch (phase) {
      case "check-queues":
        s._setEducationalText("Event Loop is checking task queues. It always checks and drains the microtask queue first before executing a single macrotask.");
        break;
      case "start-microtask":
        s._setEducationalText(`Event Loop selects microtask "${task?.label || "callback"}" from queue.`);
        break;
      case "animate-microtask-to-loop":
        s._setEducationalText(`Moving microtask "${task?.label || "callback"}" through the Event Loop to the Call Stack.`);
        break;
      case "animate-microtask-to-stack":
        s._setEducationalText(`Pushing microtask "${task?.label || "callback"}" onto the Call Stack.`);
        break;
      case "execute-microtask":
        s._setEducationalText(`Executing microtask "${task?.label || "callback"}" on the Call Stack. If this schedules more tasks, they will be enqueued.`);
        break;
      case "start-macrotask":
        s._setEducationalText(`Microtask queue is empty. Event Loop selects one macrotask "${task?.label || "callback"}" from the queue.`);
        break;
      case "animate-macrotask-to-loop":
        s._setEducationalText(`Moving macrotask "${task?.label || "callback"}" through the Event Loop to the Call Stack.`);
        break;
      case "animate-macrotask-to-stack":
        s._setEducationalText(`Pushing macrotask "${task?.label || "callback"}" onto the Call Stack.`);
        break;
      case "execute-macrotask":
        s._setEducationalText(`Executing macrotask "${task?.label || "callback"}" on the Call Stack. Microtask queue will be checked immediately after this finishes.`);
        break;
      case "done":
        s._setEducationalText("Simulation complete. The Call Stack is empty and all queues are fully drained. The Event Loop is idle.");
        break;
    }
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
