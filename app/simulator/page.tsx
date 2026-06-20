"use client";

import AppShell from "@/app/_components/layout/AppShell";
import ControlPanel from "@/app/_components/controls/ControlPanel";
import VisualizationArea from "@/app/_components/visualization/VisualizationArea";
import BottomPanel from "@/app/_components/bottom/BottomPanel";
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
        <div
          style={{
            flex: 1,
            display: "flex",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Left: Control Panel */}
          <ControlPanel />

          {/* Center: Visualization */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <VisualizationArea />
            <BottomPanel />
          </div>

          {/* Right: Stats Panel */}
          <div
            style={{
              width: 220,
              minWidth: 220,
              borderLeft: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
              overflow: "auto",
            }}
          >
            <StatsPanel />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
