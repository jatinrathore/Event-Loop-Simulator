"use client";

import { useRuntimeStore } from "@/app/_lib/store";

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
      {/* Educational Phase Overlay */}
      <div
        style={{
          background: phase.bg,
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          transition: "background 0.4s ease",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: phase.color,
              boxShadow: `0 0 8px ${phase.color}`,
              flexShrink: 0,
              animation: isRunning && !isPaused ? "blink 1.2s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: phase.color,
              transition: "color 0.3s ease",
            }}
          >
            {phase.label}
          </span>
        </div>
        <p style={{ fontSize: 10.5, color: "var(--text-secondary)", lineHeight: 1.3, margin: 0 }}>
          {phase.desc}
        </p>
      </div>

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
