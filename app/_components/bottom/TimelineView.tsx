"use client";

import React, { useRef, useEffect } from "react";
import { useRuntimeStore } from "@/app/_lib/store";

export default function TimelineView() {
  const { phaseHistory, microtaskQueue, macrotaskQueue, currentPhase, isRunning } = useRuntimeStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Project future phases
  const allPhases: any[] = [...phaseHistory];
  let nextPhaseNum = phaseHistory.length + 1;

  // 1. If we have microtasks in queue and we are not currently draining them, the next phase will drain them
  if (microtaskQueue.length > 0 && currentPhase !== "draining-microtasks") {
    allPhases.push({
      id: `projected-micro`,
      phaseNumber: nextPhaseNum++,
      kind: "microtask-drain",
      label: "Drain Microtasks",
      taskCount: microtaskQueue.length,
      status: "pending",
      startedAt: 0,
    });
  }

  // 2. Add each remaining macrotask as a projected future phase
  macrotaskQueue.forEach((macro) => {
    allPhases.push({
      id: `projected-macro-${macro.id}`,
      phaseNumber: nextPhaseNum++,
      kind: "macrotask",
      label: macro.label,
      taskCount: 1,
      status: "pending",
      startedAt: 0,
    });
  });

  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to the active node or to the end
      const activeElement = scrollRef.current.querySelector(".active-phase-node");
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } else {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }
  }, [phaseHistory.length, allPhases.length]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {allPhases.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 12,
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <line x1="3" y1="12" x2="21" y2="12" />
            <circle cx="7" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="17" cy="12" r="2" />
          </svg>
          <span style={{ opacity: 0.5 }}>Phase timeline will populate when tasks are scheduled or running</span>
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            overflowX: "auto",
            overflowY: "hidden",
            flex: 1,
            padding: "16px 24px",
          }}
        >
          {allPhases.map((phase, idx) => {
            const isCompleted = phase.status === "completed";
            const isActive = phase.status === "active";
            const isPending = phase.status === "pending";

            // Determine border color, background, color based on state
            let bubbleBorder = "2px solid var(--border-default)";
            let bubbleBg = "transparent";
            let bubbleColor = "var(--text-muted)";
            let labelColor = "var(--text-secondary)";
            let connectorColor = "var(--border-subtle)";

            if (isCompleted) {
              bubbleBorder = "2px solid var(--success)";
              bubbleBg = "var(--bg-elevated)";
              bubbleColor = "var(--success)";
              labelColor = "var(--text-primary)";
              connectorColor = "var(--success)";
            } else if (isActive) {
              bubbleBorder = "2px solid var(--loop-primary)";
              bubbleBg = "var(--bg-elevated)";
              bubbleColor = "var(--loop-primary)";
              labelColor = "var(--text-primary)";
              connectorColor = "var(--border-default)";
            }

            const isMicro = phase.kind === "microtask-drain";

            return (
              <React.Fragment key={phase.id}>
                {/* Node */}
                <div
                  className={`phase-node ${isActive ? "active-phase-node" : ""}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 120,
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="phase-node-bubble animate-pop-in"
                    style={{
                      border: bubbleBorder,
                      background: bubbleBg,
                      color: bubbleColor,
                      boxShadow: isActive ? "0 0 10px var(--loop-glow)" : "none",
                      position: "relative",
                      animation: isActive ? "pulse-ring 2.5s infinite ease-in-out" : "none",
                    }}
                  >
                    {isCompleted ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      phase.phaseNumber
                    )}

                    {/* Small badge to denote microtask drain vs macrotask */}
                    <div
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: isMicro ? "var(--micro-primary)" : "var(--macro-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 800,
                      }}
                      title={isMicro ? "Microtask Drain" : "Macrotask"}
                    >
                      {isMicro ? "M" : "T"}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: isActive || isCompleted ? 700 : 500,
                        color: labelColor,
                        fontFamily: isMicro ? "Inter, sans-serif" : "JetBrains Mono, monospace",
                        textAlign: "center",
                        maxWidth: 110,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {phase.label}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      {phase.taskCount > 0
                        ? `${phase.taskCount} task${phase.taskCount > 1 ? "s" : ""}`
                        : "pending"}
                    </span>
                  </div>
                </div>

                {/* Connector Line */}
                {idx < allPhases.length - 1 && (
                  <div
                    className="phase-connector"
                    style={{
                      height: 2,
                      background: connectorColor,
                      flex: "1 0 20px",
                      minWidth: 20,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
