"use client";

import { useRuntimeStore } from "@/app/_lib/store";
import TaskCard from "./TaskCard";

export default function EventLoopNode() {
  const { currentTask, currentPhase, isRunning, microtaskQueue, macrotaskQueue, callStack } = useRuntimeStore();

  const isActive =
    currentPhase === "draining-microtasks" ||
    currentPhase === "executing-macrotask";

  const hasWork =
    microtaskQueue.length > 0 || macrotaskQueue.length > 0;

  const isFullyIdle =
    !isRunning && !hasWork && callStack.length === 0;

  const transitingTask =
    currentTask &&
    (currentTask.status === "event-loop" ||
      currentTask.status === "moving-to-event-loop" ||
      currentTask.status === "moving-to-stack")
      ? currentTask
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--loop-primary)",
          textShadow: "0 0 12px var(--loop-glow)",
        }}
      >
        Event Loop
      </div>

      {/* Main ring */}
      <div style={{ position: "relative", width: 140, height: 140 }}>
        {/* Outer glow ring */}
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: "1px solid rgba(20, 184, 166, 0.15)",
            animation: isActive 
              ? "spin-slow 4s linear infinite" 
              : isFullyIdle 
              ? "spin-slow 15s linear infinite" 
              : "none",
          }}
        />

        {/* Animated orbit dot */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 8,
              height: 8,
              marginTop: -4,
              marginLeft: -4,
              animation: "orbit 2s linear infinite",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--loop-primary)",
                boxShadow: "0 0 10px var(--loop-glow)",
              }}
            />
          </div>
        )}

        {/* Middle dashed ring */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            border: "1.5px dashed rgba(20, 184, 166, 0.2)",
            animation: isFullyIdle ? "spin-slow 20s linear infinite reverse" : "none",
          }}
        />

        {/* Main circle */}
        <div
          className={isActive ? "animate-glow-pulse" : ""}
          style={{
            position: "absolute",
            inset: 18,
            borderRadius: "50%",
            background: isActive
              ? "radial-gradient(circle at 40% 35%, rgba(20, 184, 166, 0.18), rgba(13, 148, 136, 0.06))"
              : isFullyIdle
              ? "radial-gradient(circle at 40% 35%, rgba(20, 184, 166, 0.08), transparent)"
              : "radial-gradient(circle at 40% 35%, rgba(20, 184, 166, 0.06), transparent)",
            border: `2px solid ${isActive ? "var(--loop-primary)" : "rgba(20, 184, 166, 0.3)"}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            transition: "all 0.4s ease",
            boxShadow: isActive
              ? "0 0 20px var(--loop-glow), inset 0 0 20px rgba(20, 184, 166, 0.05)"
              : isFullyIdle
              ? "0 0 8px rgba(20, 184, 166, 0.1)"
              : "none",
            animation: isFullyIdle ? "pulse-ring 4s ease-in-out infinite" : "none",
          }}
        >
          {/* Center icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--loop-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: isActive ? 1 : 0.4,
              filter: isActive ? "drop-shadow(0 0 6px var(--loop-glow))" : "none",
              transition: "all 0.3s ease",
              animation: isActive ? "spin-slow 6s linear infinite" : isFullyIdle ? "spin-slow 12s linear infinite" : "none",
            }}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>

          {/* Status text */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isActive ? "var(--loop-primary)" : "var(--text-muted)",
              transition: "color 0.3s ease",
            }}
          >
            {isActive ? "Active" : hasWork ? "Ready" : "Idle"}
          </div>
        </div>
      </div>

      {/* Current transiting task */}
      <div
        style={{
          minHeight: 45,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {transitingTask ? (
          <div className="animate-pop-in">
            <TaskCard task={transitingTask} size="sm" />
          </div>
        ) : isFullyIdle ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              opacity: 0.8,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Event Loop Idle
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
              Call Stack Empty
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
              No Tasks Scheduled
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            {isRunning && !transitingTask ? "Processing…" : "Awaiting tasks"}
          </div>
        )}
      </div>
    </div>
  );
}
