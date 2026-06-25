"use client";

import { useStoreContext as useRuntimeStore } from "@/app/_components/StoreProvider";

interface EducationalBannerProps {
  phase: {
    label: string;
    desc: string;
    color: string;
    bg: string;
  };
  isRunning: boolean;
  isPaused: boolean;
}

export default function EducationalBanner({ phase, isRunning, isPaused }: EducationalBannerProps) {
  const { educationalText } = useRuntimeStore();

  const activeText = educationalText || phase.desc;

  return (
    <div
      style={{
        background: phase.bg,
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition: "all 0.4s ease",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: phase.color,
            boxShadow: `0 0 8px ${phase.color}`,
            flexShrink: 0,
            animation: isRunning && !isPaused ? "blink 1.2s ease-in-out infinite" : "none",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: phase.color,
            transition: "color 0.3s ease",
          }}
        >
          {phase.label}
        </span>
      </div>
      <p
        style={{
          fontSize: 10.5,
          color: "var(--text-secondary)",
          lineHeight: 1.4,
          margin: 0,
          transition: "all 0.3s ease",
        }}
      >
        {activeText}
      </p>
    </div>
  );
}
