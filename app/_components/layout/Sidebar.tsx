"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  {
    href: "/simulator",
    label: "Simulator",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/analyzer",
    label: "Code Analyzer",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    href: "/timeline",
    label: "Timeline",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" />
        <circle cx="7" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="17" cy="12" r="2" />
      </svg>
    ),
  },
  {
    href: "/docs",
    label: "Concepts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 12px",
        gap: "4px",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        className="sidebar-logo-container"
        style={{
          padding: "8px 10px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Animated event loop icon */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid var(--loop-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px var(--loop-glow)",
            animation: "glow-pulse 2s ease-in-out infinite",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--loop-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
            Event Loop
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
            Visualizer v2.0.0
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        <div className="sidebar-nav-header" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 12px 8px" }}>
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === "/simulator" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span className="nav-item-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer badge */}
      <div
        className="sidebar-footer-text"
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: 11 }}>
            Simulation Engine
          </span>
          <span>JS Runtime Visualizer</span>
        </div>
      </div>
    </aside>
  );
}
