// ─── Task ────────────────────────────────────────────────────────────────────

export type TaskType = "microtask" | "macrotask";

export type TaskStatus =
  | "queued"
  | "moving-to-event-loop"
  | "event-loop"
  | "moving-to-stack"
  | "executing"
  | "completed";

export interface Task {
  id: string;
  label: string;
  type: TaskType;
  status: TaskStatus;
  createdAt: number;
}

// ─── Log Entry ────────────────────────────────────────────────────────────────

export type LogType = "info" | "micro" | "macro" | "system";

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: LogType;
}

// ─── Timeline Tick ────────────────────────────────────────────────────────────

export interface TimelineTick {
  id: string;
  tick: number;
  taskId: string;
  taskLabel: string;
  taskType: TaskType;
  event: string;
  timestamp: number;
}

// ─── Runtime Phase ────────────────────────────────────────────────────────────

export type RuntimePhase =
  | "idle"
  | "draining-microtasks"
  | "executing-macrotask"
  | "executing-task";

// ─── Runtime State ────────────────────────────────────────────────────────────

export interface RuntimeState {
  callStack: Task[];
  microtaskQueue: Task[];
  macrotaskQueue: Task[];
  completedTasks: Task[];
  currentTask: Task | null;
  currentIteration: number;
  currentPhase: RuntimePhase;
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  executionLogs: LogEntry[];
  timelineTicks: TimelineTick[];
  tickCounter: number;
}

// ─── Speed Config ─────────────────────────────────────────────────────────────

export const SPEED_MULTIPLIERS = [0.5, 1, 2, 5] as const;
export type SpeedMultiplier = (typeof SPEED_MULTIPLIERS)[number];

// ─── Timing (at 1x speed, ms) ─────────────────────────────────────────────────

export const BASE_TIMING = {
  queueToEventLoop: 700,
  eventLoopToStack: 700,
  executing: 500,
  completing: 500,
} as const;

// ─── Microtask label variants ─────────────────────────────────────────────────

export const MICROTASK_LABELS = [
  "Promise.then()",
  "queueMicrotask()",
  "Promise.resolve()",
  ".catch()",
  ".finally()",
] as const;

export const MACROTASK_LABELS = [
  "setTimeout()",
  "setInterval()",
  "MessageChannel",
  "requestAnimationFrame()",
  "I/O callback",
] as const;
