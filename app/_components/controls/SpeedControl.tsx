"use client";

import { useStoreContext as useRuntimeStore } from "@/app/_components/StoreProvider";
import { SPEED_MULTIPLIERS } from "@/app/_lib/types";

export default function SpeedControl() {
  const { speed, setSpeed } = useRuntimeStore();

  return (
    <div style={{ padding: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
        Speed
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
        {SPEED_MULTIPLIERS.map((s) => (
          <button
            key={s}
            className="btn btn-ghost"
            style={{
              padding: "6px 2px",
              fontSize: 10,
              background: speed === s ? "var(--stack-bg)" : "transparent",
              borderColor: speed === s ? "var(--stack-primary)" : "var(--border-subtle)",
              color: speed === s ? "var(--stack-primary)" : "var(--text-secondary)",
            }}
            onClick={() => setSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>
        {speed === 0.1
          ? "Extremely Slow (7.0s per step)"
          : speed === 0.25
            ? "Very Slow (2.8s per step)"
            : speed === 0.5
              ? "Slow (1.4s per step)"
              : speed === 1
                ? "Normal (700ms per step)"
                : speed === 2
                  ? "Fast (350ms per step)"
                  : speed === 5
                    ? "Very Fast (140ms per step)"
                    : "Blazing Fast (70ms per step)"}
      </div>
    </div>
  );
}
