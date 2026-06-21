"use client";

import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      {/* Desktop Experience Required Gate (visible only below 768px viewport width) */}
      <div className="desktop-gate">
        <div className="desktop-gate-content">
          <div className="desktop-gate-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--loop-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </div>
          <h2 className="desktop-gate-title">Desktop Experience Required</h2>
          <p className="desktop-gate-text">
            This simulator contains large runtime visualizations and is best experienced on a laptop or desktop computer. It is not designed for mobile devices.
          </p>
          <div className="desktop-gate-specs">
            <div className="desktop-gate-spec-card">
              <div className="desktop-gate-spec-label">Recommended Width</div>
              <div className="desktop-gate-spec-value">1024px+</div>
            </div>
            <div className="desktop-gate-spec-card">
              <div className="desktop-gate-spec-label">Supported Devices</div>
              <div className="desktop-gate-spec-value">Desktop & Laptop</div>
            </div>
          </div>
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
