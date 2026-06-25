"use client";

import { useRef, useEffect } from "react";
import { useStoreContext as useRuntimeStore } from "@/app/_components/StoreProvider";

const TYPE_COLORS: Record<string, string> = {
  micro: "log-msg-micro",
  macro: "log-msg-macro",
  system: "log-msg-system",
  info: "log-msg-info",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

export default function ExecutionLogs() {
  const { executionLogs } = useRuntimeStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [executionLogs.length]);

  return (
    <div
      className="log-terminal"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
        </div>
        <span style={{ color: "#3d4f6e", fontSize: 11, fontWeight: 600, marginLeft: 4 }}>
          execution_log — event-loop-visualizer
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "#3d4f6e",
          }}
        >
          {executionLogs.length} entries
        </span>
      </div>

      {/* Logs */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {executionLogs.length === 0 ? (
          <div style={{ color: "#3d4f6e", fontSize: 11 }}>
            <span style={{ color: "#22c55e" }}>$</span> Waiting for simulation to start…
            <span style={{ animation: "blink 1s ease-in-out infinite", display: "inline-block" }}>▌</span>
          </div>
        ) : (
          executionLogs.map((entry) => (
            <div key={entry.id} className="log-entry">
              <span className="log-ts">[{formatTime(entry.timestamp)}]</span>
              <span className={TYPE_COLORS[entry.type] || "log-msg-info"}>
                {entry.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
