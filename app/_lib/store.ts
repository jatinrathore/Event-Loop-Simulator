"use client";

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import {
  RuntimeState,
  Task,
  TaskStatus,
  LogEntry,
  LogType,
  TimelineTick,
  TaskType,
  RuntimePhase,
  PhaseEntry,
  MICROTASK_LABELS,
  MACROTASK_LABELS,
  CallStackScenario,
  ScenarioPreset,
} from "./types";

// ─── Label rotation counters ──────────────────────────────────────────────────
let microLabelIdx = 0;
let macroLabelIdx = 0;

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: RuntimeState & { phaseHistory: PhaseEntry[] } = {
  callStack: [],
  microtaskQueue: [],
  macrotaskQueue: [],
  completedTasks: [],
  currentTask: null,
  currentPhaseNumber: 0,   // Event Loop phase counter (0 = idle/not started)
  tasksExecuted: 0,        // Total tasks completed
  currentPhase: "idle",
  isRunning: false,
  isPaused: false,
  speed: 1,
  executionLogs: [],
  timelineTicks: [],
  tickCounter: 0,
  phaseHistory: [],        // Visual phase timeline entries
  callStackScenario: "empty",
  educationalText: "",
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface RuntimeStore extends RuntimeState {
  phaseHistory: PhaseEntry[];

  // User-facing actions
  addMicrotask: (schedules?: { type: TaskType } | null) => void;
  addMacrotask: (schedules?: { type: TaskType } | null) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  stepForward: () => void;
  setSpeed: (speed: number) => void;
  setCallStackScenario: (scenario: CallStackScenario) => void;
  applyPreset: (preset: ScenarioPreset) => void;
  updateTaskSchedules: (taskId: string, schedules: { type: TaskType } | null) => void;

  // Engine-facing internal mutations
  _setPhase: (phase: RuntimePhase) => void;
  _setRunning: (running: boolean) => void;
  _setPaused: (paused: boolean) => void;
  _setCurrentTask: (task: Task | null) => void;
  _updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  _moveTaskToCallStack: (task: Task) => void;
  _removeFromMicrotaskQueue: (taskId: string) => void;
  _removeFromMacrotaskQueue: (taskId: string) => void;
  _removeFromCallStack: (taskId: string) => void;
  _completeTask: (task: Task) => void;
  /**
   * Advance the Event Loop phase counter.
   * Called ONCE per microtask-drain session (not per task) and ONCE per macrotask.
   */
  _advancePhase: (kind: "microtask-drain" | "macrotask", label: string) => void;
  _updateActivePhaseTaskCount: (delta: number) => void;
  _completeActivePhase: () => void;
  _pushLog: (message: string, type: LogType) => void;
  _pushTick: (taskId: string, taskLabel: string, taskType: TaskType, event: string) => void;
  _setEducationalText: (text: string) => void;
  _addScheduledTask: (task: Task) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useRuntimeStore = create<RuntimeStore>((set, get) => ({
  ...initialState,

  // ─── User Actions ─────────────────────────────────────────────────────────

  addMicrotask: (schedules) => {
    const label = MICROTASK_LABELS[microLabelIdx % MICROTASK_LABELS.length];
    microLabelIdx++;
    const task: Task = {
      id: uuid(),
      label,
      type: "microtask",
      status: "queued",
      createdAt: Date.now(),
      schedules: schedules || null,
    };
    set((s) => ({ microtaskQueue: [...s.microtaskQueue, task] }));
    get()._pushLog(`[Micro] Added ${label} to Microtask Queue`, "micro");
  },

  addMacrotask: (schedules) => {
    const label = MACROTASK_LABELS[macroLabelIdx % MACROTASK_LABELS.length];
    macroLabelIdx++;
    const task: Task = {
      id: uuid(),
      label,
      type: "macrotask",
      status: "queued",
      createdAt: Date.now(),
      schedules: schedules || null,
    };
    set((s) => ({ macrotaskQueue: [...s.macrotaskQueue, task] }));
    get()._pushLog(`[Macro] Added ${label} to Macrotask Queue`, "macro");
  },

  startSimulation: () => {
    const { isRunning, microtaskQueue, macrotaskQueue } = get();
    if (isRunning) return;
    if (microtaskQueue.length === 0 && macrotaskQueue.length === 0 && get().callStack.length === 0) return;
    
    get()._pushLog("[Init] Simulation Started", "system");
    set({ isRunning: true, isPaused: false });
  },

  pauseSimulation: () => {
    set({ isPaused: true });
    get()._pushLog("[Pause] Simulation Paused", "system");
  },

  resumeSimulation: () => {
    set({ isPaused: false });
    get()._pushLog("[Resume] Simulation Resumed", "system");
  },

  resetSimulation: () => {
    microLabelIdx = 0;
    macroLabelIdx = 0;
    set({
      ...initialState,
      executionLogs: [
        {
          id: uuid(),
          timestamp: Date.now(),
          message: "[Reset] Simulation Reset",
          type: "system",
        },
      ],
    });
  },

  stepForward: () => {
    set({ isPaused: false });
    // Engine re-pauses after one step.
  },

  setSpeed: (speed: number) => {
    set({ speed });
  },

  setCallStackScenario: (scenario) => {
    set({ callStackScenario: scenario });
    if (scenario === "busy-sync") {
      const syncTask: Task = {
        id: "sync-task-main",
        label: "main() [Sync Execution]",
        type: "macrotask",
        status: "executing",
        createdAt: Date.now(),
      };
      set({
        callStack: [syncTask],
        currentTask: syncTask,
      });
      get()._pushLog("[Config] Call Stack scenario set to: busy-sync (main() task loaded)", "system");
    } else {
      set({
        callStack: [],
        currentTask: null,
      });
      get()._pushLog("[Config] Call Stack scenario set to: empty (Call Stack cleared)", "system");
    }
  },

  updateTaskSchedules: (taskId, schedules) => {
    const updateIn = (arr: Task[]) =>
      arr.map((t) => (t.id === taskId ? { ...t, schedules } : t));
    set((s) => ({
      microtaskQueue: updateIn(s.microtaskQueue),
      macrotaskQueue: updateIn(s.macrotaskQueue),
    }));
  },

  applyPreset: (preset) => {
    microLabelIdx = 0;
    macroLabelIdx = 0;
    
    const baseState = {
      ...initialState,
    };

    if (preset === "basic") {
      set(baseState);
      get()._pushLog("[Preset] Applied: Basic (Empty)", "system");
    } else if (preset === "call-stack-busy") {
      set(baseState);
      get().setCallStackScenario("busy-sync");
      // Add a couple of dummy tasks so they can start after stack clears
      get().addMicrotask();
      get().addMacrotask();
      get()._pushLog("[Preset] Applied: Busy Call Stack", "system");
    } else if (preset === "macro-schedules-micro") {
      set(baseState);
      const task: Task = {
        id: uuid(),
        label: "setTimeout() (T1)",
        type: "macrotask",
        status: "queued",
        createdAt: Date.now(),
        schedules: { type: "microtask" },
      };
      set({
        macrotaskQueue: [task],
      });
      get()._pushLog("[Preset] Applied: Macrotask Schedules Microtask", "system");
    } else if (preset === "nested-microtasks") {
      set(baseState);
      const task: Task = {
        id: uuid(),
        label: "queueMicrotask() (M1)",
        type: "microtask",
        status: "queued",
        createdAt: Date.now(),
        schedules: { type: "microtask" },
      };
      set({
        microtaskQueue: [task],
      });
      get()._pushLog("[Preset] Applied: Nested Microtasks", "system");
    }
  },

  // ─── Internal Engine Mutations ────────────────────────────────────────────

  _setPhase: (phase) => set({ currentPhase: phase }),
  _setRunning: (running) => set({ isRunning: running }),
  _setPaused: (paused) => set({ isPaused: paused }),
  _setCurrentTask: (task) => set({ currentTask: task }),

  _updateTaskStatus: (taskId, status) => {
    const updateIn = (arr: Task[]) =>
      arr.map((t) => (t.id === taskId ? { ...t, status } : t));
    set((s) => ({
      microtaskQueue: updateIn(s.microtaskQueue),
      macrotaskQueue: updateIn(s.macrotaskQueue),
      callStack: updateIn(s.callStack),
      currentTask:
        s.currentTask?.id === taskId
          ? { ...s.currentTask, status }
          : s.currentTask,
    }));
  },

  _moveTaskToCallStack: (task) => {
    const updatedTask = { ...task, status: "executing" as TaskStatus };
    set((s) => ({
      callStack: [updatedTask, ...s.callStack],
      currentTask: updatedTask,
    }));
  },

  _removeFromMicrotaskQueue: (taskId) =>
    set((s) => ({
      microtaskQueue: s.microtaskQueue.filter((t) => t.id !== taskId),
    })),

  _removeFromMacrotaskQueue: (taskId) =>
    set((s) => ({
      macrotaskQueue: s.macrotaskQueue.filter((t) => t.id !== taskId),
    })),

  _removeFromCallStack: (taskId) =>
    set((s) => ({
      callStack: s.callStack.filter((t) => t.id !== taskId),
    })),

  _completeTask: (task) => {
    const completed = { ...task, status: "completed" as TaskStatus };
    set((s) => ({
      callStack: s.callStack.filter((t) => t.id !== task.id),
      completedTasks: [completed, ...s.completedTasks],
      tasksExecuted: s.tasksExecuted + 1,
      currentTask: null,
    }));
  },

  /**
   * Called ONCE when a new Event Loop phase begins:
   * - start of a microtask-drain session
   * - start of each macrotask
   */
  _advancePhase: (kind, label) => {
    const nextPhaseNumber = get().currentPhaseNumber + 1;
    const entry: PhaseEntry = {
      id: uuid(),
      phaseNumber: nextPhaseNumber,
      kind,
      label,
      taskCount: 0,
      status: "active",
      startedAt: Date.now(),
    };
    set((s) => ({
      currentPhaseNumber: nextPhaseNumber,
      phaseHistory: [...s.phaseHistory, entry],
    }));
  },

  _updateActivePhaseTaskCount: (delta) => {
    set((s) => {
      if (s.phaseHistory.length === 0) return {};
      const updated = [...s.phaseHistory];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = { ...last, taskCount: last.taskCount + delta };
      return { phaseHistory: updated };
    });
  },

  _completeActivePhase: () => {
    set((s) => {
      if (s.phaseHistory.length === 0) return {};
      const updated = [...s.phaseHistory];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = { ...last, status: "completed" };
      return { phaseHistory: updated };
    });
  },

  _pushLog: (message, type) => {
    const entry: LogEntry = {
      id: uuid(),
      timestamp: Date.now(),
      message,
      type,
    };
    set((s) => ({ executionLogs: [...s.executionLogs, entry] }));
  },

  _pushTick: (taskId, taskLabel, taskType, event) => {
    const state = get();
    const tick = state.tickCounter + 1;
    const tickEntry: TimelineTick = {
      id: uuid(),
      tick,
      taskId,
      taskLabel,
      taskType,
      event,
      timestamp: Date.now(),
    };
    set((s) => ({
      timelineTicks: [...s.timelineTicks, tickEntry],
      tickCounter: tick,
    }));
  },

  _setEducationalText: (text) => set({ educationalText: text }),

  _addScheduledTask: (task) => {
    set((s) => ({
      microtaskQueue: task.type === "microtask"
        ? [...s.microtaskQueue, task]
        : s.microtaskQueue,
      macrotaskQueue: task.type === "macrotask"
        ? [...s.macrotaskQueue, task]
        : s.macrotaskQueue,
    }));
    get()._pushLog(`[Schedule] Task ${task.label} scheduled new ${task.type}`, "system");
  },
}));
