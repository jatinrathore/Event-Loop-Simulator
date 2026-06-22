"use client";

import { useRuntimeStore } from "@/app/_lib/store";
import EducationalBanner from "./EducationalBanner";

const PHASE_LABELS: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  idle: {
    label: "Event Loop Idle",
    desc: "Call Stack Empty. No tasks scheduled. Add microtasks or macrotasks to begin.",
    color: "var(--text-muted)",
    bg: "var(--bg-surface)",
  },
  "draining-microtasks": {
    label: "⚡ Draining Microtasks",
    desc: "Event Loop is executing all queued microtasks before checking the macrotask queue.",
    color: "var(--micro-primary)",
    bg: "var(--micro-bg)",
  },
  "executing-macrotask": {
    label: "⏱ Executing Macrotask",
    desc: "Microtask queue is empty. Event Loop selected the next macrotask.",
    color: "var(--macro-primary)",
    bg: "var(--macro-bg)",
  },
  "executing-task": {
    label: "▶ Executing Task",
    desc: "The selected task is currently running in the Call Stack context.",
    color: "var(--stack-primary)",
    bg: "var(--stack-bg)",
  },
};

export default function StatsPanel() {
  const {
    microtaskQueue,
    macrotaskQueue,
    completedTasks,
    currentPhaseNumber,
    tasksExecuted,
    currentPhase,
    isRunning,
    isPaused,
    callStack,
  } = useRuntimeStore();

  const phase = PHASE_LABELS[currentPhase] || PHASE_LABELS.idle;

  const statusLabel = !isRunning
    ? completedTasks.length > 0
      ? "Simulation Complete"
      : "Waiting to Start"
    : isPaused
      ? "Paused"
      : "Running";

  const statusColor = !isRunning
    ? completedTasks.length > 0
      ? "var(--success)"
      : "var(--text-muted)"
    : isPaused
      ? "var(--warning)"
      : "var(--success)";

  return (
    <div className="stats-panel-container">
      <EducationalBanner phase={phase} isRunning={isRunning} isPaused={isPaused} />

      {/* Stats Cards Grid (Exactly 4 cards) */}
      <div className="stats-grid">
        {/* Card 1: Event Loop Phase */}
        <div className="stat-card" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="stat-label" style={{ fontSize: "9px" }}>Event Loop Iteration</div>
          <div className="stat-value" style={{ color: "var(--loop-primary)", fontSize: "24px", marginTop: 2 }}>
            {currentPhaseNumber}
          </div>
        </div>

        {/* Card 2: Tasks Executed */}
        <div className="stat-card" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="stat-label" style={{ fontSize: "9px" }}>Tasks Executed</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <div className="stat-value" style={{ color: "var(--stack-primary)", fontSize: "24px" }}>
              {tasksExecuted}
            </div>
            {callStack.length > 0 && (
              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--stack-primary)", background: "var(--stack-bg)", padding: "1px 4px", borderRadius: 4 }}>
                Stack: {callStack.length}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Microtasks */}
        <div className="stat-card" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="stat-label" style={{ fontSize: "9px" }}>⚡ Microtasks Left</div>
          <div
            className="stat-value"
            style={{ color: microtaskQueue.length > 0 ? "var(--micro-primary)" : "var(--text-muted)", fontSize: "24px", marginTop: 2 }}
          >
            {microtaskQueue.length}
          </div>
        </div>

        {/* Card 4: Macrotasks */}
        <div className="stat-card" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="stat-label" style={{ fontSize: "9px" }}>⏱ Macrotasks Left</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <div
              className="stat-value"
              style={{ color: macrotaskQueue.length > 0 ? "var(--macro-primary)" : "var(--text-muted)", fontSize: "24px" }}
            >
              {macrotaskQueue.length}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: statusColor, display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: statusColor }} />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
