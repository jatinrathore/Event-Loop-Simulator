"use client";

import { useStoreContext as useRuntimeStore } from "@/app/_components/StoreProvider";
import { useState } from "react";

export default function ConsolePanel() {
  const {
    consoleOutput,
    expectedOutput,
    isRunning,
    guessMode,
    userPrediction,
    setUserPrediction,
    setGuessMode,
  } = useRuntimeStore();

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedIdx === null || draggedIdx === idx) return;

    const newPrediction = [...userPrediction];
    const draggedItem = newPrediction[draggedIdx];
    
    // Swap or splice
    newPrediction.splice(draggedIdx, 1);
    newPrediction.splice(idx, 0, draggedItem);
    
    setUserPrediction(newPrediction);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  return (
    <div className="analyzer-console-card guess-mode-container" style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", minHeight: "220px", marginTop: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "12px" }}>
      <div className="guess-mode-headers" style={{ display: "flex", marginBottom: 8, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: guessMode ? "50%" : "100%", alignItems: "center", justifyContent: "space-between", paddingRight: guessMode ? 12 : 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Console Output
          </div>
          {!guessMode && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(167, 139, 250, 0.15)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(167, 139, 250, 0.3)" }}>
              <input type="checkbox" id="guess-mode-toggle" checked={guessMode} onChange={(e) => setGuessMode(e.target.checked)} disabled={isRunning} style={{ accentColor: "var(--micro-primary)", cursor: isRunning ? "not-allowed" : "pointer", width: 14, height: 14 }} />
              <label htmlFor="guess-mode-toggle" style={{ fontSize: 11, fontWeight: 700, color: "var(--micro-text)", cursor: isRunning ? "not-allowed" : "pointer" }}>GUESS MODE</label>
            </div>
          )}
        </div>
        {guessMode && (
          <div
            className="guess-mode-pred-header"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              width: "50%",
              paddingLeft: 12,
              borderLeft: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Your Prediction</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(167, 139, 250, 0.15)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(167, 139, 250, 0.3)" }}>
              <input type="checkbox" id="guess-mode-toggle-active" checked={guessMode} onChange={(e) => setGuessMode(e.target.checked)} disabled={isRunning} style={{ accentColor: "var(--micro-primary)", cursor: isRunning ? "not-allowed" : "pointer", width: 14, height: 14 }} />
              <label htmlFor="guess-mode-toggle-active" style={{ fontSize: 11, fontWeight: 700, color: "var(--micro-text)", cursor: isRunning ? "not-allowed" : "pointer" }}>GUESS MODE</label>
            </div>
          </div>
        )}
      </div>

      <div
        className="guess-mode-content"
        style={{
          background: "#030712",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          flex: 1,
          display: "flex",
          overflow: "hidden",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
        }}
      >
        {/* Actual Console Output Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Terminal Header */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24" }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            </div>
            <span style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace", fontWeight: 500 }}>
              node_vm_terminal.sh
            </span>
            <span style={{ width: 20 }} />
          </div>

          {/* Terminal Logs View */}
          <div
            style={{
              padding: "12px",
              flex: 1,
              overflowY: "auto",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11.5,
              lineHeight: 1.5,
              color: "#f3f4f6",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* Expected Static Prediction Header (Hidden if Guess Mode is ON) */}
            {!guessMode && expectedOutput.length > 0 && (
              <div style={{ color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6, marginBottom: 6 }}>
                <span style={{ color: "var(--loop-primary)", fontWeight: 700 }}>[Static Plan] Expected: </span>
                {expectedOutput.join(" → ") || "No logs"}
              </div>
            )}

            {/* Dynamic Runtime Console Logs */}
            {consoleOutput.map((log, index) => (
              <div key={index} style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "var(--loop-primary)", opacity: 0.6 }}>&gt;</span>
                <span style={{ wordBreak: "break-all" }}>{log}</span>
              </div>
            ))}

            {/* Blinking Cursor if running */}
            {isRunning && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "var(--loop-primary)", opacity: 0.6 }}>&gt;</span>
                <span
                  style={{
                    width: 6,
                    height: 12,
                    background: "var(--loop-primary)",
                    animation: "blink-cursor 0.8s step-end infinite",
                  }}
                />
              </div>
            )}

            {/* Empty state */}
            {consoleOutput.length === 0 && !isRunning && (
              <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: 11, padding: "8px 0" }}>
                Terminal is idle. Click Analyze then Run to stream console logs.
              </div>
            )}
          </div>
        </div>

        {/* Guess Mode Prediction UI */}
        {guessMode && (
          <div className="guess-mode-pred-panel" style={{ flex: 1, borderLeft: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9.5,
                color: "var(--text-muted)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Drag to Reorder
            </div>
            <div style={{ padding: "12px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {userPrediction.length === 0 && !isRunning && (
                <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: 11, textAlign: "center", marginTop: 20 }}>
                  Analyze code to generate draggable predictions.
                </div>
              )}
              {userPrediction.map((item, idx) => {
                const isReached = idx < consoleOutput.length;
                const isCorrect = isReached && consoleOutput[idx] === item;
                const isWrong = isReached && consoleOutput[idx] !== item;

                return (
                  <div
                    key={idx}
                    draggable={!isRunning}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      padding: "8px 12px",
                      background: isCorrect ? "rgba(34, 197, 94, 0.15)" : isWrong ? "rgba(239, 68, 68, 0.15)" : "var(--bg-elevated)",
                      border: `1px solid ${isCorrect ? "rgba(34, 197, 94, 0.4)" : isWrong ? "rgba(239, 68, 68, 0.4)" : "var(--border-subtle)"}`,
                      borderRadius: "6px",
                      fontSize: 11.5,
                      fontFamily: "JetBrains Mono, monospace",
                      color: isCorrect ? "#4ade80" : isWrong ? "#f87171" : "var(--text-primary)",
                      cursor: isRunning ? "default" : "grab",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      opacity: draggedIdx === idx ? 0.5 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                      {!isRunning && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5, flexShrink: 0 }}>
                          <line x1="8" y1="6" x2="21" y2="6" />
                          <line x1="8" y1="12" x2="21" y2="12" />
                          <line x1="8" y1="18" x2="21" y2="18" />
                          <line x1="3" y1="6" x2="3.01" y2="6" />
                          <line x1="3" y1="12" x2="3.01" y2="12" />
                          <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                      )}
                      <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item}</span>
                    </div>
                    {isReached && (
                      <span style={{ fontSize: 14 }}>
                        {isCorrect ? "🟢" : "🔴"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
