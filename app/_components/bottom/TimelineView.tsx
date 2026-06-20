"use client";

import { useRef, useEffect } from "react";
import { useRuntimeStore } from "@/app/_lib/store";

const EVENT_COLORS: Record<string, string> = {
  microtask: "var(--micro-primary)",
  macrotask: "var(--macro-primary)",
};

const EVENT_ICONS: Record<string, string> = {
  "entered Event Loop": "⟳",
  "entered Call Stack": "→",
  executing: "▶",
  completed: "✓",
};

export default function TimelineView() {
  const { timelineTicks } = useRuntimeStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [timelineTicks.length]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {timelineTicks.length === 0 ? (
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
          <span style={{ opacity: 0.5 }}>Timeline will populate when simulation runs</span>
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 0,
            overflowX: "auto",
            overflowY: "hidden",
            flex: 1,
            padding: "0 16px 0 8px",
          }}
        >
          {timelineTicks.map((tick, i) => {
            const color = EVENT_COLORS[tick.taskType] || "var(--text-secondary)";
            const icon = EVENT_ICONS[tick.event] || "·";
            const isFirst =
              i === 0 || timelineTicks[i - 1]?.taskId !== tick.taskId;
            const isLast =
              i === timelineTicks.length - 1 ||
              timelineTicks[i + 1]?.taskId !== tick.taskId;

            return (
              <div
                key={tick.id}
                className="animate-slide-up"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 80,
                  maxWidth: 100,
                  gap: 4,
                  paddingBottom: 8,
                  position: "relative",
                  animationDelay: `${i * 0.02}s`,
                }}
              >
                {/* Tick label + event */}
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  Tick {tick.tick}
                </div>

                {/* Task label */}
                <div
                  style={{
                    fontSize: 9,
                    color,
                    fontWeight: 600,
                    fontFamily: "JetBrains Mono, monospace",
                    textAlign: "center",
                    lineHeight: 1.2,
                    maxWidth: 90,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={`${tick.taskLabel} — ${tick.event}`}
                >
                  {tick.taskLabel}
                </div>

                {/* Event icon bubble */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background:
                      tick.taskType === "microtask"
                        ? "rgba(139, 92, 246, 0.15)"
                        : "rgba(245, 158, 11, 0.12)",
                    border: `1.5px solid ${color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color,
                    boxShadow: `0 0 8px ${color}44`,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>

                {/* Event name */}
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    textAlign: "center",
                    lineHeight: 1.3,
                    maxWidth: 80,
                  }}
                >
                  {tick.event}
                </div>

                {/* Horizontal connector line */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: isFirst ? "50%" : 0,
                    right: isLast ? "50%" : 0,
                    height: 1,
                    background: `${color}33`,
                    zIndex: -1,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
