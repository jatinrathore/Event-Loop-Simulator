"use client";

import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <>

      {/* Desktop Experience Recommended Gate (visible only below 768px viewport width) */}
      <div className="desktop-gate">
        <div className="desktop-gate-content">
          <div className="desktop-gate-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--loop-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </div>
          <h2 className="desktop-gate-title">Desktop Experience Recommended</h2>
          <p className="desktop-gate-text">
            This Event Loop Simulator and Code Analyzer are designed for larger screens because they visualize:
          </p>
          <ul className="desktop-gate-list">
            <li>Call Stack</li>
            <li>Event Loop</li>
            <li>Microtask Queue</li>
            <li>Macrotask Queue</li>
            <li>Runtime Timeline</li>
            <li>Console Output</li>
          </ul>
          <p className="desktop-gate-footer">
            Please use a tablet, laptop, or desktop device.
          </p>
        </div>
      </div>

      {/* Main Desktop App */}
      <div
        className="app-main-layout"
        style={{
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          background: "var(--bg-base)",
        }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
