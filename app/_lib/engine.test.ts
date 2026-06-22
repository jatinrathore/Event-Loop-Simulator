/**
 * Engine Validation Tests
 *
 * Tests the SimulationEngine phase-counting behavior against the specification:
 *   - One microtask-drain session = 1 Event Loop phase
 *   - One macrotask = 1 Event Loop phase
 *   - 10 micros + 20 macros = 21 phases, 30 tasks executed
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SimulationEngine } from "./engine";
import type { EngineStore } from "./engine";
import type { Task, TaskStatus, RuntimePhase } from "./types";

// ─── Minimal in-memory store for testing ─────────────────────────────────────

type Phase = "microtask-drain" | "macrotask";

function createTestStore(
  micros: number,
  macros: number,
  speedMultiplier: number = 50 // very fast for tests
) {
  // Build task arrays
  const microtaskQueue: Task[] = Array.from({ length: micros }, (_, i) => ({
    id: `m${i}`,
    label: `Microtask-${i + 1}`,
    type: "microtask" as const,
    status: "queued" as TaskStatus,
    createdAt: Date.now(),
  }));

  const macrotaskQueue: Task[] = Array.from({ length: macros }, (_, i) => ({
    id: `t${i}`,
    label: `Macrotask-${i + 1}`,
    type: "macrotask" as const,
    status: "queued" as TaskStatus,
    createdAt: Date.now(),
  }));

  // Mutable state
  const state = {
    microtaskQueue: [...microtaskQueue],
    macrotaskQueue: [...macrotaskQueue],
    callStack: [] as Task[],
    currentTask: null as Task | null,
    isRunning: true,
    isPaused: false,
    speed: speedMultiplier,
    currentPhase: "idle" as RuntimePhase,

    // metrics
    phaseCount: 0,
    tasksCompleted: 0,
    phaseHistory: [] as Array<{ kind: Phase; label: string; taskCount: number }>,
    logs: [] as string[],
  };

  const store: EngineStore = {
    get microtaskQueue() { return state.microtaskQueue; },
    get macrotaskQueue() { return state.macrotaskQueue; },
    get callStack() { return state.callStack; },
    get currentTask() { return state.currentTask; },
    get isRunning() { return state.isRunning; },
    get isPaused() { return state.isPaused; },
    get speed() { return state.speed; },
    get currentPhase() { return state.currentPhase; },

    _setPhase(phase) { state.currentPhase = phase as RuntimePhase; },
    _setRunning(v) { state.isRunning = v; },
    _setPaused(v) { state.isPaused = v; },
    _setCurrentTask(t) { state.currentTask = t; },

    _updateTaskStatus(id, status) {
      const updateArr = (arr: Task[]) =>
        arr.map((t) => (t.id === id ? { ...t, status } : t));
      state.microtaskQueue = updateArr(state.microtaskQueue);
      state.macrotaskQueue = updateArr(state.macrotaskQueue);
      state.callStack = updateArr(state.callStack);
    },

    _moveTaskToCallStack(task) {
      const t = { ...task, status: "executing" as TaskStatus };
      state.callStack = [t, ...state.callStack];
      state.currentTask = t;
    },

    _removeFromMicrotaskQueue(id) {
      state.microtaskQueue = state.microtaskQueue.filter((t) => t.id !== id);
    },

    _removeFromMacrotaskQueue(id) {
      state.macrotaskQueue = state.macrotaskQueue.filter((t) => t.id !== id);
    },

    _removeFromCallStack(id) {
      state.callStack = state.callStack.filter((t) => t.id !== id);
    },

    _completeTask(task) {
      state.callStack = state.callStack.filter((t) => t.id !== task.id);
      state.currentTask = null;
      state.tasksCompleted++;
    },

    _advancePhase(kind, label) {
      state.phaseCount++;
      state.phaseHistory.push({ kind, label, taskCount: 0 });
    },

    _updateActivePhaseTaskCount(delta) {
      if (state.phaseHistory.length === 0) return;
      state.phaseHistory[state.phaseHistory.length - 1].taskCount += delta;
    },

    _completeActivePhase() {
      // no-op for test tracking (state is already tracked above)
    },

    _pushLog(msg) {
      state.logs.push(msg);
    },

    _pushTick() {},
  };

  return { store, state };
}

/**
 * Run the engine to completion synchronously using fake timers.
 * Returns after all queues are drained.
 */
async function runToCompletion(engine: SimulationEngine, store: EngineStore) {
  vi.useFakeTimers();
  engine.start(() => store);

  // Drain all pending timers up to 10_000 ticks (safety cap)
  for (let i = 0; i < 10_000; i++) {
    await vi.runAllTimersAsync();
    if (!store.isRunning) break;
  }

  vi.useRealTimers();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SimulationEngine — Event Loop Phase Counting", () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine();
    vi.useFakeTimers();
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  // ── Test 1 ─────────────────────────────────────────────────────────────────
  it("Test 1: 10 microtasks + 20 macrotasks → 21 phases, 30 tasks executed", async () => {
    const { store, state } = createTestStore(10, 20);
    await runToCompletion(engine, store);

    expect(state.tasksCompleted).toBe(30);
    expect(state.phaseCount).toBe(21);
    // Verify structure: first phase is a drain, rest are macrotasks
    expect(state.phaseHistory[0].kind).toBe("microtask-drain");
    expect(state.phaseHistory[0].taskCount).toBe(10);
    for (let i = 1; i <= 20; i++) {
      expect(state.phaseHistory[i].kind).toBe("macrotask");
      expect(state.phaseHistory[i].taskCount).toBe(1);
    }
  });

  // ── Test 2 ─────────────────────────────────────────────────────────────────
  it("Test 2: 0 microtasks + 20 macrotasks → 20 phases, 20 tasks executed", async () => {
    const { store, state } = createTestStore(0, 20);
    await runToCompletion(engine, store);

    expect(state.tasksCompleted).toBe(20);
    expect(state.phaseCount).toBe(20);
    // All phases should be macrotask phases
    expect(state.phaseHistory.every((p) => p.kind === "macrotask")).toBe(true);
  });

  // ── Test 3 ─────────────────────────────────────────────────────────────────
  it("Test 3: 10 microtasks + 0 macrotasks → 1 phase, 10 tasks executed", async () => {
    const { store, state } = createTestStore(10, 0);
    await runToCompletion(engine, store);

    expect(state.tasksCompleted).toBe(10);
    expect(state.phaseCount).toBe(1);
    expect(state.phaseHistory[0].kind).toBe("microtask-drain");
    expect(state.phaseHistory[0].taskCount).toBe(10);
  });

  // ── Test 4 ─────────────────────────────────────────────────────────────────
  it("Test 4: 3 microtasks + 2 macrotasks → 3 phases, 5 tasks executed", async () => {
    const { store, state } = createTestStore(3, 2);
    await runToCompletion(engine, store);

    expect(state.tasksCompleted).toBe(5);
    expect(state.phaseCount).toBe(3);
    expect(state.phaseHistory[0].kind).toBe("microtask-drain");
    expect(state.phaseHistory[1].kind).toBe("macrotask");
    expect(state.phaseHistory[2].kind).toBe("macrotask");
  });

  // ── Test 5 ─────────────────────────────────────────────────────────────────
  it("Test 5: macrotask schedules microtask → 2 phases (1 macro + 1 drain)", async () => {
    /**
     * Setup: 0 initial microtasks, 1 macrotask
     * During macrotask _completeTask, we inject a microtask into the queue.
     * Expected:
     *   Phase 1: Execute T1  (macrotask)
     *   Phase 2: Drain M1    (microtask scheduled by T1)
     * Total: 2 phases, 2 tasks
     */
    const { store, state } = createTestStore(0, 1);

    // Intercept _completeTask to inject a microtask when T1 is completed
    const origComplete = store._completeTask.bind(store);
    store._completeTask = (task) => {
      origComplete(task);
      if (task.id === "t0") {
        // Inject scheduled microtask
        state.microtaskQueue.push({
          id: "scheduled-m1",
          label: "ScheduledMicrotask",
          type: "microtask",
          status: "queued",
          createdAt: Date.now(),
        });
      }
    };

    await runToCompletion(engine, store);

    expect(state.tasksCompleted).toBe(2);
    expect(state.phaseCount).toBe(2);
    expect(state.phaseHistory[0].kind).toBe("macrotask");    // Phase 1: T1
    expect(state.phaseHistory[1].kind).toBe("microtask-drain"); // Phase 2: scheduled M1
  });

  // ── Test 6 ─────────────────────────────────────────────────────────────────
  it("Test 6: nested microtasks (M1 schedules M2) → 1 phase, 2 tasks", async () => {
    /**
     * M1 schedules M2 during its execution.
     * Both drain in the SAME microtask phase — no phase increment between them.
     * Expected: 1 phase, 2 tasks executed.
     */
    const { store, state } = createTestStore(1, 0);

    const origComplete = store._completeTask.bind(store);
    store._completeTask = (task) => {
      origComplete(task);
      if (task.id === "m0") {
        // M1 schedules M2 into the queue
        state.microtaskQueue.push({
          id: "nested-m2",
          label: "NestedMicrotask-M2",
          type: "microtask",
          status: "queued",
          createdAt: Date.now(),
        });
      }
    };

    await runToCompletion(engine, store);

    expect(state.tasksCompleted).toBe(2);
    expect(state.phaseCount).toBe(1);
    expect(state.phaseHistory[0].kind).toBe("microtask-drain");
    // Both M1 and M2 counted in the same phase
    expect(state.phaseHistory[0].taskCount).toBe(2);
  });
});
