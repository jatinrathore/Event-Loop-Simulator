"use client";

import { useState } from "react";
import AppShell from "@/app/_components/layout/AppShell";
import { useTimelineHistoryStore, TimelineSource, TimelineSession } from "@/app/_lib/timelineStore";

export default function TimelinePage() {
  return <TimelineContent />;
}

function TimelineContent() {
  const { sessions } = useTimelineHistoryStore();
  const [filter, setFilter] = useState<"All" | TimelineSource>("All");

  const filteredSessions = sessions.filter(
    (s) => filter === "All" || s.source === filter
  );

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
        {/* Header with Filters */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700 }}>Execution Timeline</h1>
            
            <div style={{ display: "flex", background: "var(--bg-elevated)", padding: 4, borderRadius: 8, gap: 4 }}>
              {(["All", "Simulator", "Code Analyzer"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: "none",
                    background: filter === f ? "var(--border-default)" : "transparent",
                    color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {f === "All" ? "All Activity" : `${f} Only`}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-secondary)" }}>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>{filteredSessions.length}</strong> sessions
            </span>
          </div>
        </div>

        {/* Timeline Sessions List */}
        <div style={{ flex: 1, padding: "20px 40px", overflow: "auto" }}>
          {filteredSessions.length === 0 ? (
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
                No timeline data yet. Run a simulation or analysis first.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 60 }}>
              {filteredSessions.map((session) => (
                <SessionGroup key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SessionGroup({ session }: { session: TimelineSession }) {
  const isAnalyzer = session.source === "Code Analyzer";
  const accentColor = isAnalyzer ? "var(--macro-primary)" : "var(--loop-primary)";
  const bgColor = isAnalyzer ? "rgba(245, 158, 11, 0.05)" : "rgba(59, 130, 246, 0.05)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Session Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          {session.source} Run #{session.runNumber}
        </h2>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {new Date(session.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Events */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: `1px solid var(--border-subtle)`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {session.entries.length === 0 ? (
          <div style={{ padding: "16px 20px", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
            No events recorded in this run.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: bgColor }}>
                {["Time", "Task Type", "Task Label", "Event", "Iteration"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border-subtle)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {session.entries.map((tick, i) => (
                <tr
                  key={tick.id}
                  style={{
                    borderBottom: i < session.entries.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  }}
                >
                  <td style={{ padding: "10px 16px", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace", width: 100 }}>
                    {tick.timeString}
                  </td>
                  <td style={{ padding: "10px 16px", width: 120 }}>
                    {tick.taskType && (
                      <span
                        className="phase-badge"
                        style={{
                          background: tick.taskType === "microtask" ? "rgba(139,92,246,0.1)" : tick.taskType === "macrotask" ? "rgba(245,158,11,0.1)" : "rgba(100,100,100,0.1)",
                          color: tick.taskType === "microtask" ? "var(--micro-primary)" : tick.taskType === "macrotask" ? "var(--macro-primary)" : "var(--text-secondary)",
                        }}
                      >
                        {tick.taskType}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", fontFamily: "JetBrains Mono, monospace", color: tick.taskType === "microtask" ? "var(--micro-primary)" : tick.taskType === "macrotask" ? "var(--macro-primary)" : "var(--text-primary)" }}>
                    {tick.taskLabel || "-"}
                  </td>
                  <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>
                    {tick.eventLabel}
                  </td>
                  <td style={{ padding: "10px 16px", color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace", width: 80 }}>
                    {tick.iteration !== undefined ? `#${tick.iteration}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
