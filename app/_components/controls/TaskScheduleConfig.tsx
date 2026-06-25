"use client";

import { useStoreContext as useRuntimeStore } from "@/app/_components/StoreProvider";
import { Task, TaskType } from "@/app/_lib/types";

export default function TaskScheduleConfig() {
  const { microtaskQueue, macrotaskQueue, updateTaskSchedules, isRunning } = useRuntimeStore();

  const allQueuedTasks = [...microtaskQueue, ...macrotaskQueue].filter(
    (t) => t.status === "queued"
  );

  if (allQueuedTasks.length === 0 || isRunning) {
    return null;
  }

  return (
    <div
      style={{
        padding: "12px 14px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(255, 255, 255, 0.01)",
      }}
    >
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
        Configure Callbacks (Scheduling)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {allQueuedTasks.map((task) => (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 11,
              padding: "6px 8px",
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: task.type === "microtask" ? "var(--micro-primary)" : "var(--macro-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 120,
              }}
            >
              {task.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Checkbox to enable/disable callback scheduling */}
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, cursor: "pointer", color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={!!task.schedules}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateTaskSchedules(task.id, { type: "microtask" });
                    } else {
                      updateTaskSchedules(task.id, null);
                    }
                  }}
                  style={{ cursor: "pointer", accentColor: "var(--stack-primary)" }}
                />
                Schedules callback
              </label>

              {/* Show options only if checkbox is checked */}
              {task.schedules && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {task.type === "microtask" ? (
                    <span style={{ fontSize: 9.5, color: "var(--micro-primary)", fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>
                      ⚡ Microtask
                    </span>
                  ) : (
                    <select
                      value={task.schedules.type}
                      onChange={(e) => {
                        updateTaskSchedules(task.id, { type: e.target.value as TaskType });
                      }}
                      style={{
                        background: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 4,
                        fontSize: 9.5,
                        padding: "1px 3px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 600,
                      }}
                    >
                      <option value="microtask">⚡ Microtask</option>
                      <option value="macrotask">⏱ Macrotask</option>
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
