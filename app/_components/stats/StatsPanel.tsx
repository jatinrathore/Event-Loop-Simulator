"use client";

import { useRuntimeStore } from "@/app/_lib/store";

const PHASE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  idle: { label: "Idle — Awaiting Tasks", color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)" },
  "draining-microtasks": { label: "⚡ Draining Microtasks", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
  "executing-macrotask": { label: "⏱ Executing Macrotask", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  "executing-task": { label: "▶ Executing Task", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
};

export default function StatsPanel() {
  const {
    microtaskQueue,
    macrotaskQueue,
    completedTasks,
    currentIteration,
    currentPhase,
    isRunning,
    isPaused,
    callStack,
  } = useRuntimeStore();

  const phase = PHASE_LABELS[currentPhase] || PHASE_LABELS.idle;

  const statusLabel = !isRunning
    ? completedTasks.length > 0
      ? "✓ Simulation Complete"
      : "Waiting to Start"
    : isPaused
    ? "⏸ Paused"
    : "▶ Running";

  const statusColor = !isRunning
    ? completedTasks.length > 0
      ? "#22c55e"
      : "#6b7280"
    : isPaused
    ? "#f59e0b"
    : "#22c55e";

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
      {/* Phase Overlay */}
      <div
        style={{
          padding: "10px 14px",
          background: phase.bg,
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          transition: "background 0.4s ease",
        }}
      >
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

      {/* Stats Grid */}
      <div
        style={{
          padding: "12px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div className="stat-card">
          <div className="stat-label">⚡ Microtasks Left</div>
          <div
            className="stat-value"
            style={{ color: microtaskQueue.length > 0 ? "var(--micro-primary)" : "var(--text-muted)" }}
          >
            {microtaskQueue.length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">⏱ Macrotasks Left</div>
          <div
            className="stat-value"
            style={{ color: macrotaskQueue.length > 0 ? "var(--macro-primary)" : "var(--text-muted)" }}
          >
            {macrotaskQueue.length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">✓ Completed</div>
          <div
            className="stat-value"
            style={{ color: completedTasks.length > 0 ? "#22c55e" : "var(--text-muted)" }}
          >
            {completedTasks.length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label"># Iteration</div>
          <div className="stat-value" style={{ color: "var(--stack-primary)" }}>
            {currentIteration}
          </div>
        </div>

        <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
          <div className="stat-label">Status</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: statusColor, marginTop: 2 }}>
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Call Stack size */}
      {callStack.length > 0 && (
        <div
          style={{
            margin: "0 12px 12px",
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
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
        <div style={{ padding: "0 12px 12px", flex: 1, overflow: "hidden" }}>
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
            Recently Completed
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
                <span style={{ color: "#22c55e" }}>✓</span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: task.type === "microtask" ? "#c4b5fd" : "#fcd34d",
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
