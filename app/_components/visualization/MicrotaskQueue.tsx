"use client";

import { useRuntimeStore } from "@/app/_lib/store";
import TaskCard from "./TaskCard";

export default function MicrotaskQueue() {
  const { microtaskQueue, currentPhase } = useRuntimeStore();
  const isDraining = currentPhase === "draining-microtasks";

  return (
    <div
      className="glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        border: `1px solid ${isDraining ? "rgba(139, 92, 246, 0.5)" : "var(--border-subtle)"}`,
        transition: "border-color 0.3s ease",
        boxShadow: isDraining ? "0 0 20px rgba(139, 92, 246, 0.12)" : "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px 10px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--micro-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span
          className="queue-header-micro"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          Microtask Queue
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {isDraining && (
            <span
              className="phase-badge"
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                color: "var(--micro-primary)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                animation: "pulse-ring 1s ease-in-out infinite",
              }}
            >
              Draining
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 999,
              background: microtaskQueue.length > 0 ? "rgba(139, 92, 246, 0.15)" : "var(--bg-elevated)",
              color: microtaskQueue.length > 0 ? "var(--micro-primary)" : "var(--text-muted)",
              border: `1px solid ${microtaskQueue.length > 0 ? "rgba(139, 92, 246, 0.3)" : "var(--border-subtle)"}`,
            }}
          >
            {microtaskQueue.length}
          </span>
        </div>
      </div>

      {/* Priority label */}
      <div
        style={{
          padding: "5px 14px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(139, 92, 246, 0.04)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--micro-primary)",
            boxShadow: "0 0 6px var(--micro-glow)",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 10, color: "var(--micro-primary)", fontWeight: 600 }}>
          HIGH PRIORITY — Always drains before Macrotasks
        </span>
      </div>

      {/* Queue items (FIFO) */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          justifyContent: microtaskQueue.length === 0 ? "center" : "flex-start",
          alignItems: microtaskQueue.length === 0 ? "center" : "stretch",
        }}
      >
        {microtaskQueue.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 11,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span style={{ opacity: 0.5 }}>Queue is empty</span>
          </div>
        ) : (
          microtaskQueue.map((task, i) => (
            <div
              key={task.id}
              className="animate-task-enter"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                animationDelay: `${i * 0.04}s`,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 600,
                  width: 14,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <TaskCard task={task} size="sm" index={i} />
              {i === 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 9,
                    color: "var(--micro-primary)",
                    fontWeight: 600,
                    opacity: 0.7,
                  }}
                >
                  next ›
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "5px 14px",
          borderTop: "1px solid var(--border-subtle)",
          background: "rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 9, color: "var(--text-muted)", textAlign: "center" }}>
          FIFO — First In, First Out
        </div>
      </div>
    </div>
  );
}
