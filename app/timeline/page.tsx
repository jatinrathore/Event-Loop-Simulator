"use client";

import AppShell from "@/app/_components/layout/AppShell";
import TimelineView from "@/app/_components/bottom/TimelineView";
import { useRuntimeStore } from "@/app/_lib/store";

export default function TimelinePage() {
  const { timelineTicks, completedTasks, currentPhaseNumber } = useRuntimeStore();

  return (
    <AppShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>Execution Timeline</h1>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-secondary)" }}>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>{timelineTicks.length}</strong> ticks
            </span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>{completedTasks.length}</strong> completed
            </span>
            <span>
              Phase <strong style={{ color: "var(--stack-primary)" }}>{currentPhaseNumber}</strong>
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, padding: 20, overflow: "auto" }}>
          {timelineTicks.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                color: "var(--text-muted)",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
                <line x1="3" y1="12" x2="21" y2="12" />
                <circle cx="7" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="17" cy="12" r="2" />
              </svg>
              <p style={{ fontSize: 14, opacity: 0.5 }}>
                No timeline data yet. Run a simulation first.
              </p>
              <a href="/simulator" className="btn btn-primary" style={{ textDecoration: "none" }}>
                Go to Simulator →
              </a>
            </div>
          ) : (
            <div style={{ height: 200, background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-subtle)", padding: 12, overflow: "auto" }}>
              <TimelineView />
            </div>
          )}

          {/* Tick details table */}
          {timelineTicks.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.06em" }}>
                TICK DETAILS
              </h2>
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {["Tick", "Task", "Type", "Event"].map((h) => (
                        <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timelineTicks.map((tick, i) => (
                      <tr
                        key={tick.id}
                        style={{
                          borderTop: "1px solid var(--border-subtle)",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                        }}
                      >
                        <td style={{ padding: "7px 14px", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
                          {tick.tick}
                        </td>
                        <td style={{ padding: "7px 14px", fontFamily: "JetBrains Mono, monospace", color: tick.taskType === "microtask" ? "var(--micro-primary)" : "var(--macro-primary)" }}>
                          {tick.taskLabel}
                        </td>
                        <td style={{ padding: "7px 14px" }}>
                          <span
                            className="phase-badge"
                            style={{
                              background: tick.taskType === "microtask" ? "rgba(139,92,246,0.1)" : "rgba(245,158,11,0.1)",
                              color: tick.taskType === "microtask" ? "var(--micro-primary)" : "var(--macro-primary)",
                            }}
                          >
                            {tick.taskType}
                          </span>
                        </td>
                        <td style={{ padding: "7px 14px", color: "var(--text-secondary)" }}>
                          {tick.event}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
