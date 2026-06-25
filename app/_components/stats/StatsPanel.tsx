"use client";

import { useStoreContext as useRuntimeStore } from "@/app/_components/StoreProvider";
import EducationalBanner from "./EducationalBanner";

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

export default function StatsPanel({ showMetrics = false }: { showMetrics?: boolean }) {
  const {
    currentPhaseNumber,
    currentPhase,
    isRunning,
    isPaused,
    tasksExecuted,
    microtaskQueue,
    macrotaskQueue,
  } = useRuntimeStore();

  const phase = PHASE_LABELS[currentPhase] || PHASE_LABELS.idle;

  return (
    <div className="stats-panel-container">
      {/* Educational Banner (Wide) */}
      <div className="stat-card stat-card-wide" style={{ padding: 0, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
        <EducationalBanner phase={phase} isRunning={isRunning} isPaused={isPaused} />
      </div>

      {/* Event Loop Iteration */}
      <div className="stat-card stat-card-narrow" style={{ padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="stat-label" style={{ fontSize: "9px", lineHeight: 1.2 }}>Event Loop<br/>Iteration</div>
        <div className="stat-value" style={{ color: "var(--loop-primary)", fontSize: "24px", marginTop: 2 }}>
          {currentPhaseNumber}
        </div>
      </div>

      {/* Optional Metrics for Simulator Page */}
      {showMetrics && (
        <>
          <div className="stat-card stat-card-narrow" style={{ padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="stat-label" style={{ fontSize: "9px", lineHeight: 1.2 }}>Tasks<br/>Executed</div>
            <div className="stat-value" style={{ color: "var(--text-primary)", fontSize: "24px", marginTop: 2 }}>{tasksExecuted}</div>
          </div>
          <div className="stat-card stat-card-narrow" style={{ padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="stat-label" style={{ fontSize: "9px", lineHeight: 1.2 }}>Microtasks<br/>Left</div>
            <div className="stat-value" style={{ color: "var(--micro-primary)", fontSize: "24px", marginTop: 2 }}>{microtaskQueue.length}</div>
          </div>
          <div className="stat-card stat-card-narrow" style={{ padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="stat-label" style={{ fontSize: "9px", lineHeight: 1.2 }}>Macrotasks<br/>Left</div>
            <div className="stat-value" style={{ color: "var(--macro-primary)", fontSize: "24px", marginTop: 2 }}>{macrotaskQueue.length}</div>
          </div>
        </>
      )}
    </div>
  );
}
