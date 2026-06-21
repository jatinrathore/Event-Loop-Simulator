"use client";

import AppShell from "@/app/_components/layout/AppShell";
import ControlPanel from "@/app/_components/controls/ControlPanel";
import VisualizationArea from "@/app/_components/visualization/VisualizationArea";
import TimelineView from "@/app/_components/bottom/TimelineView";
import ExecutionLogs from "@/app/_components/bottom/ExecutionLogs";
import StatsPanel from "@/app/_components/stats/StatsPanel";

export default function SimulatorPage() {
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
        {/* Top bar */}
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
            background: "var(--bg-surface)",
          }}
        >
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            JS Event Loop Simulator
          </h1>
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(20, 184, 166, 0.1)",
              color: "var(--loop-primary)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            Simulation Engine
          </span>
        </div>

        {/* Main content area */}
        <div className="sim-main-container">
          {/* Left: Control Panel */}
          <ControlPanel />

          {/* Center Content Column */}
          <div className="sim-center-column">
            <StatsPanel />
            <VisualizationArea />
            
            {/* Bottom Timeline and Logs both visible simultaneously */}
            <div className="bottom-sections-container">
              <div className="timeline-section-card">
                <div className="bottom-section-title">📊 Phase Timeline</div>
                <div className="timeline-wrapper">
                  <TimelineView />
                </div>
              </div>
              
              <div className="logs-section-card">
                <div className="bottom-section-title">🖥️ Execution Logs</div>
                <div className="logs-wrapper">
                  <ExecutionLogs />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
