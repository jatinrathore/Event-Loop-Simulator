"use client";

import { useStoreContext as useRuntimeStore } from "@/app/_components/StoreProvider";
import { ScenarioPreset } from "@/app/_lib/types";

export default function ScenarioPresets() {
  const { applyPreset, isRunning } = useRuntimeStore();

  const presets: { id: ScenarioPreset; label: string; desc: string }[] = [
    {
      id: "basic",
      label: "Basic",
      desc: "Clear queues and start fresh",
    },
    {
      id: "call-stack-busy",
      label: "Busy Stack",
      desc: "Run synchronous code first",
    },
    {
      id: "macro-schedules-micro",
      label: "Macro → Micro",
      desc: "setTimeout schedules Promise",
    },
    {
      id: "nested-microtasks",
      label: "Nested Micro",
      desc: "Promise schedules Promise",
    },
  ];

  return (
    <div style={{ padding: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        Presets
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {presets.map((p) => (
            <button
              key={p.id}
              className="btn btn-ghost"
              style={{
                fontSize: 10,
                padding: "6px 4px",
                textAlign: "center",
                fontWeight: 600,
              }}
              onClick={() => applyPreset(p.id)}
              disabled={isRunning}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
