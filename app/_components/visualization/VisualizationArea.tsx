"use client";

import MicrotaskQueue from "./MicrotaskQueue";
import MacrotaskQueue from "./MacrotaskQueue";
import EventLoopNode from "./EventLoopNode";
import CallStack from "./CallStack";

export default function VisualizationArea() {
  return (
    <div className="vis-grid">
      {/* Col 1 Queues */}
      <div className="vis-microtask">
        <MicrotaskQueue />
      </div>

      {/* Col 2: Event Loop (spans both rows) — connector arrows rendered here */}
      <div className="vis-loop" style={{ position: "relative" }}>
        {/* Arrow: Queue → Event Loop (left side) */}
        <div
          className="vis-connector-arrow"
          style={{
            position: "absolute",
            top: "25%",
            transform: "translateY(-50%)",
            left: "-32px",
            width: "32px",
            height: "2px",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "1.5px",
              background: "linear-gradient(90deg, rgba(139,92,246,0.15), rgba(139,92,246,0.5))",
              backgroundImage: "repeating-linear-gradient(90deg, rgba(139,92,246,0.5) 0px, rgba(139,92,246,0.5) 5px, transparent 5px, transparent 9px)",
            }}
          />
          <svg width="7" height="10" viewBox="0 0 7 10" fill="none" style={{ flexShrink: 0, marginLeft: -1 }}>
            <polygon points="0,0 7,5 0,10" fill="rgba(139,92,246,0.5)" />
          </svg>
        </div>
        {/* Arrow: Queue → Event Loop (bottom - macrotask side) */}
        <div
          className="vis-connector-arrow"
          style={{
            position: "absolute",
            top: "75%",
            transform: "translateY(-50%)",
            left: "-32px",
            width: "32px",
            height: "2px",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "1.5px",
              backgroundImage: "repeating-linear-gradient(90deg, rgba(245,158,11,0.5) 0px, rgba(245,158,11,0.5) 5px, transparent 5px, transparent 9px)",
            }}
          />
          <svg width="7" height="10" viewBox="0 0 7 10" fill="none" style={{ flexShrink: 0, marginLeft: -1 }}>
            <polygon points="0,0 7,5 0,10" fill="rgba(245,158,11,0.5)" />
          </svg>
        </div>
        {/* Arrow: Event Loop → Call Stack (right side, centered vertically) */}
        <div
          className="vis-connector-arrow"
          style={{
            position: "absolute",
            top: "50%",
            right: "-32px",
            width: "32px",
            height: "2px",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "1.5px",
              backgroundImage: "repeating-linear-gradient(90deg, rgba(96,165,250,0.5) 0px, rgba(96,165,250,0.5) 5px, transparent 5px, transparent 9px)",
            }}
          />
          <svg width="7" height="10" viewBox="0 0 7 10" fill="none" style={{ flexShrink: 0, marginLeft: -1 }}>
            <polygon points="0,0 7,5 0,10" fill="rgba(96,165,250,0.5)" />
          </svg>
        </div>
 
        <EventLoopNode />
      </div>

      {/* Col 3: Call Stack (spans both rows) */}
      <div className="vis-stack">
        <CallStack />
      </div>

      {/* Row 2, Col 1: Macrotask Queue */}
      <div className="vis-macrotask">
        <MacrotaskQueue />
      </div>
    </div>
  );
}

