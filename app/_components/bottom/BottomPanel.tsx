"use client";

import { useState } from "react";
import ExecutionLogs from "./ExecutionLogs";
import TimelineView from "./TimelineView";

type Tab = "timeline" | "logs";

export default function BottomPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("logs");

  return (
    <div
      style={{
        height: 180,
        minHeight: 180,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid var(--border-subtle)",
        overflow: "hidden",
        background: "var(--bg-surface)",
      }}
    >
      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0 12px",
          gap: 0,
          flexShrink: 0,
          height: 36,
        }}
      >
        {(["timeline", "logs"] as Tab[]).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            style={{
              height: "100%",
              padding: "0 14px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--stack-primary)" : "2px solid transparent",
              color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              textTransform: "capitalize",
              letterSpacing: "0.02em",
            }}
          >
            {tab === "timeline" ? "📊 Timeline" : "🖥️ Execution Logs"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "hidden", padding: "10px 12px" }}>
        {activeTab === "timeline" ? <TimelineView /> : <ExecutionLogs />}
      </div>
    </div>
  );
}
