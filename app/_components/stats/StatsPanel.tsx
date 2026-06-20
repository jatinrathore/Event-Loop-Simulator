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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Educational Phase Overlay */}
      <div
        style={{
          padding: "16px",
          background: phase.bg,
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
          transition: "background 0.4s ease",
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
              fontSize: 12,
              fontWeight: 700,
              color: phase.color,
              transition: "color 0.3s ease",
            }}
          >
            {phase.label}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
          {phase.desc}
        </p>
      </div>

      {/* Prominent Phase & Executed Counts */}
      <div
        style={{
          padding: "16px 16px 8px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="stat-card" style={{ padding: "16px" }}>
          <div className="stat-label" style={{ fontSize: "10px", fontWeight: 700 }}>Event Loop Iteration</div>
          <div className="stat-value" style={{ color: "var(--loop-primary)", fontSize: "36px", marginTop: 4 }}>
            {currentPhaseNumber}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: 2 }}>
            Drain session or individual macrotask
          </div>
        </div>

        <div className="stat-card" style={{ padding: "16px" }}>
          <div className="stat-label" style={{ fontSize: "10px", fontWeight: 700 }}>Tasks Executed</div>
          <div className="stat-value" style={{ color: "var(--stack-primary)", fontSize: "36px", marginTop: 4 }}>
            {tasksExecuted}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: 2 }}>
            Total completed tasks
          </div>
        </div>
      </div>

      {/* Remaining Stats Grid */}
      <div
        style={{
          padding: "8px 16px 16px 16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div className="stat-card" style={{ padding: "10px 12px" }}>
          <div className="stat-label">⚡ Microtasks</div>
          <div
            className="stat-value"
            style={{ color: microtaskQueue.length > 0 ? "var(--micro-primary)" : "var(--text-muted)", fontSize: "20px", marginTop: 2 }}
          >
            {microtaskQueue.length}
          </div>
        </div>

        <div className="stat-card" style={{ padding: "10px 12px" }}>
          <div className="stat-label">⏱ Macrotasks</div>
          <div
            className="stat-value"
            style={{ color: macrotaskQueue.length > 0 ? "var(--macro-primary)" : "var(--text-muted)", fontSize: "20px", marginTop: 2 }}
          >
            {macrotaskQueue.length}
          </div>
        </div>

        <div className="stat-card" style={{ gridColumn: "1 / -1", padding: "10px 12px" }}>
          <div className="stat-label">Simulation Status</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: statusColor, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Call Stack size */}
      {callStack.length > 0 && (
        <div
          style={{
            margin: "0 16px 16px",
            padding: "8px 12px",
            borderRadius: 8,
            background: "var(--stack-bg)",
            border: "1px solid rgba(37, 99, 235, 0.2)",
          }}
        >
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Call Stack Depth
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--stack-primary)" }}>
            {callStack.length}
          </div>
        </div>
      )}

      {/* Completed Tasks mini list */}
      {completedTasks.length > 0 && (
        <div style={{ padding: "0 16px 16px", flex: 1, overflow: "hidden", minHeight: 140 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Completed History
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, overflow: "auto", maxHeight: 120 }}>
            {completedTasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className="animate-task-enter"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "var(--bg-elevated)",
                  fontSize: 10,
                  opacity: 0.7,
                }}
              >
                <span style={{ color: "var(--success)" }}>✓</span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: task.type === "microtask" ? "var(--micro-primary)" : "var(--macro-primary)",
                    fontSize: 10,
                  }}
                >
                  {task.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
