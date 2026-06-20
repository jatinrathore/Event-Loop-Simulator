"use client";

import MicrotaskQueue from "./MicrotaskQueue";
import MacrotaskQueue from "./MacrotaskQueue";
import EventLoopNode from "./EventLoopNode";
import CallStack from "./CallStack";

export default function VisualizationArea() {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 200px 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 12,
        padding: "12px",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Row 1, Col 1: Microtask Queue */}
      <div style={{ gridColumn: 1, gridRow: 1, minHeight: 0, overflow: "hidden" }}>
        <MicrotaskQueue />
      </div>

      {/* Row 1+2, Col 2: Event Loop (spans both rows) */}
      <div
        style={{
          gridColumn: 2,
          gridRow: "1 / 3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Connecting lines */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
          viewBox="0 0 200 400"
          preserveAspectRatio="none"
        >
          {/* Left arrows pointing to Event Loop */}
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="rgba(255,255,255,0.1)" />
            </marker>
          </defs>
          {/* Micro → Loop */}
          <line x1="0" y1="100" x2="80" y2="200" stroke="rgba(139,92,246,0.2)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowhead)" />
          {/* Macro → Loop */}
          <line x1="0" y1="300" x2="80" y2="200" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowhead)" />
          {/* Loop → Stack */}
          <line x1="120" y1="200" x2="200" y2="200" stroke="rgba(59,130,246,0.2)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowhead)" />
        </svg>

        <EventLoopNode />
      </div>

      {/* Row 1+2, Col 3: Call Stack (spans both rows) */}
      <div
        style={{
          gridColumn: 3,
          gridRow: "1 / 3",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <CallStack />
      </div>

      {/* Row 2, Col 1: Macrotask Queue */}
      <div style={{ gridColumn: 1, gridRow: 2, minHeight: 0, overflow: "hidden" }}>
        <MacrotaskQueue />
      </div>
    </div>
  );
}
