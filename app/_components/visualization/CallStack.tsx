"use client";

import { useRuntimeStore } from "@/app/_lib/store";
import TaskCard from "./TaskCard";

export default function CallStack() {
  const { callStack, currentTask } = useRuntimeStore();

  const isExecuting = currentTask?.status === "executing";

  return (
    <div
      className="glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        border: `1px solid ${isExecuting ? "rgba(59, 130, 246, 0.4)" : "var(--border-subtle)"}`,
        transition: "border-color 0.3s ease",
        boxShadow: isExecuting ? "0 0 20px rgba(59, 130, 246, 0.15)" : "none",
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--stack-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--stack-primary)",
            textShadow: isExecuting ? "0 0 10px var(--stack-glow)" : "none",
          }}
        >
          Call Stack
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 999,
            background: callStack.length > 0 ? "rgba(59, 130, 246, 0.15)" : "var(--bg-elevated)",
            color: callStack.length > 0 ? "var(--stack-primary)" : "var(--text-muted)",
            border: `1px solid ${callStack.length > 0 ? "rgba(59, 130, 246, 0.3)" : "var(--border-subtle)"}`,
          }}
        >
          {callStack.length}
        </span>
      </div>

      {/* Stack frames */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column-reverse",
          gap: 6,
          justifyContent: callStack.length === 0 ? "center" : "flex-start",
          alignItems: callStack.length === 0 ? "center" : "stretch",
        }}
      >
        {callStack.length === 0 ? (
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span style={{ opacity: 0.5 }}>Stack is empty</span>
          </div>
        ) : (
          callStack.map((task, i) => (
            <div
              key={task.id}
              className="animate-slide-right"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: task.status === "executing"
                  ? "rgba(59, 130, 246, 0.12)"
                  : "var(--bg-elevated)",
                border: `1px solid ${task.status === "executing" ? "rgba(59, 130, 246, 0.4)" : "var(--border-subtle)"}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: task.status === "executing"
                  ? "0 0 12px rgba(59, 130, 246, 0.2)"
                  : "none",
                transition: "all 0.3s ease",
              }}
            >
              {/* Frame number */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  fontFamily: "JetBrains Mono, monospace",
                  width: 14,
                  flexShrink: 0,
                }}
              >
                {callStack.length - i}
              </span>
              <TaskCard task={task} size="sm" />
              {task.status === "executing" && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 9,
                    color: "#22c55e",
                    fontWeight: 600,
                    animation: "blink 1s ease-in-out infinite",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  ▶ exec
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom indicator */}
      <div
        style={{
          padding: "6px 14px",
          borderTop: "1px solid var(--border-subtle)",
          flexShrink: 0,
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: 2,
            borderRadius: 1,
            background: "var(--border-default)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {isExecuting && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent, var(--stack-primary), transparent)",
                animation: "shimmer 1.5s linear infinite",
                backgroundSize: "200% auto",
              }}
            />
          )}
        </div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4, textAlign: "center" }}>
          LIFO — Last In, First Out
        </div>
      </div>
    </div>
  );
}
