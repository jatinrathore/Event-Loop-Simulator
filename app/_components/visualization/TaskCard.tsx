"use client";

import { Task } from "@/app/_lib/types";

interface TaskCardProps {
  task: Task;
  size?: "sm" | "md";
  index?: number;
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  queued: {},
  "moving-to-event-loop": {
    animation: "pulse-ring 0.8s ease-in-out infinite",
  },
  "event-loop": {
    animation: "glow-pulse 0.5s ease-in-out infinite",
  },
  "moving-to-stack": {
    animation: "pulse-ring 0.8s ease-in-out infinite",
  },
  executing: {},
  completed: { opacity: 0.5 },
};

const STATUS_DOTS: Record<string, string> = {
  queued: "#4b5878",
  "moving-to-event-loop": "#f59e0b",
  "event-loop": "#14b8a6",
  "moving-to-stack": "#3b82f6",
  executing: "#22c55e",
  completed: "#6b7280",
};

export default function TaskCard({ task, size = "md", index = 0 }: TaskCardProps) {
  const isMicro = task.type === "microtask";
  const isExecuting = task.status === "executing";
  const isTransiting = task.status === "moving-to-event-loop" || task.status === "moving-to-stack" || task.status === "event-loop";

  const baseClass = isMicro ? "task-micro" : "task-macro";
  const activeClass = (isExecuting || isTransiting) ? "active" : "";

  const dotColor = STATUS_DOTS[task.status] || "#4b5878";

  return (
    <div
      className={`${baseClass} ${activeClass} animate-task-enter`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: size === "sm" ? 5 : 7,
        padding: size === "sm" ? "4px 8px" : "6px 12px",
        borderRadius: 8,
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 600,
        cursor: "default",
        userSelect: "none",
        animationDelay: `${index * 0.05}s`,
        transition: "all 0.3s ease",
        minWidth: 0,
        ...STATUS_STYLES[task.status],
      }}
    >
      {/* Status dot */}
      <span
        style={{
          width: size === "sm" ? 6 : 7,
          height: size === "sm" ? 6 : 7,
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
          boxShadow: `0 0 6px ${dotColor}`,
          transition: "background-color 0.3s ease, box-shadow 0.3s ease",
          ...(isExecuting && {
            animation: "blink 1s ease-in-out infinite",
          }),
        }}
      />

      {/* Icon */}
      {isMicro ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.8 }}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.8 }}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )}

      {/* Label */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: size === "sm" ? 10 : 11,
          wordBreak: "break-word",
          whiteSpace: "normal",
          minWidth: 0,
        }}
      >
        {task.label}
        {task.schedules && (
          <span style={{ marginLeft: 6, fontSize: size === "sm" ? 9 : 10, color: "var(--text-muted)", opacity: 0.85, fontWeight: 700 }} title={`Schedules a callback ${task.schedules.type}`}>
            ➔ {task.schedules.type === "microtask" ? "⚡" : "⏱"}
          </span>
        )}
      </span>
    </div>
  );
}
