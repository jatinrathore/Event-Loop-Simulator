"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import AppShell from "@/app/_components/layout/AppShell";
import VisualizationArea from "@/app/_components/visualization/VisualizationArea";
import TimelineView from "@/app/_components/bottom/TimelineView";
import StatsPanel from "@/app/_components/stats/StatsPanel";
import { useRuntimeStore } from "@/app/_lib/store";
import { simulationEngine } from "@/app/_lib/engine";
import { parseAndPlan } from "@/app/_lib/analyzer";
import { SPEED_MULTIPLIERS } from "@/app/_lib/types";

// ─── Preset Templates ────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: "micro-vs-macro",
    name: "Microtask vs Macrotask",
    code: `console.log("Start");

setTimeout(() => {
  console.log("Timeout callback (Macrotask)");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise.then() (Microtask)");
});

console.log("End");`,
  },
  {
    id: "nested-promises",
    name: "Nested Promise Chains",
    code: `console.log("1");

Promise.resolve()
  .then(() => {
    console.log("2");
    Promise.resolve().then(() => {
      console.log("3 (nested)");
    });
  })
  .then(() => {
    console.log("4 (chain)");
  });

console.log("5");`,
  },
  {
    id: "async-await",
    name: "Async / Await Flow",
    code: `async function example() {
  console.log("Inside async start");
  await Promise.resolve();
  console.log("After await (Continuation)");
}

console.log("Global start");
example();
console.log("Global end");`,
  },
  {
    id: "macro-schedules-micro",
    name: "Timeout Schedules Promise",
    code: `setTimeout(() => {
  console.log("Timeout executes (Macrotask)");
  Promise.resolve().then(() => {
    console.log("Promise inside Timeout executes (Microtask)");
  });
}, 0);

Promise.resolve().then(() => {
  console.log("Initial Promise executes (Microtask)");
});`,
  },
];

export default function CodeAnalyzerPage() {
  const store = useRuntimeStore();
  const {
    analyzerCode,
    setAnalyzerCode,
    loadAnalyzerPreset,
    consoleOutput,
    expectedOutput,
    isRunning,
    isPaused,
    speed,
    setSpeed,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    stepForward,
  } = store;

  const [editorCode, setEditorCode] = useState(analyzerCode || PRESETS[0].code);
  const [syntaxErrors, setSyntaxErrors] = useState<any[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisDone, setAnalysisDone] = useState(false);

  const engineStarted = useRef(false);
  const hasMounted = useRef(false);

  // Sync component state with store code on mount
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (!analyzerCode) {
        setAnalyzerCode(PRESETS[0].code);
        setEditorCode(PRESETS[0].code);
      }
    }
  }, [analyzerCode, setAnalyzerCode]);

  // Monitor execution run state for the engine
  useEffect(() => {
    if (isRunning && !isPaused) {
      if (!engineStarted.current) {
        engineStarted.current = true;
        simulationEngine.start(useRuntimeStore.getState);
      }
    }
    if (!isRunning) {
      engineStarted.current = false;
      simulationEngine.stop();
    }
  }, [isRunning, isPaused]);

  // Handle Monaco validation errors
  const handleEditorValidation = (markers: any[]) => {
    const errors = markers.filter((m) => m.severity === 8); // 8 represents MarkerSeverity.Error
    setSyntaxErrors(errors);
  };

  const handlePresetSelect = (code: string) => {
    simulationEngine.stop();
    engineStarted.current = false;
    setWarningMessage(null);
    setErrorMessage(null);
    setAnalysisDone(false);
    resetSimulation();
    setEditorCode(code);
    setAnalyzerCode(code);
  };

  const handleAnalyze = () => {
    if (syntaxErrors.length > 0) return;
    setWarningMessage(null);
    setErrorMessage(null);

    const result = parseAndPlan(editorCode);
    if (!result.success) {
      setErrorMessage(result.error || "Analysis failed.");
      setAnalysisDone(false);
      return;
    }

    setAnalysisDone(true);
    if (result.warning) {
      setWarningMessage(result.warning);
    }

    // Set store code and load queues
    setAnalyzerCode(editorCode);
    loadAnalyzerPreset(result.tasks || [], result.expectedOutput || [], result.phases || []);
  };

  const handleStart = () => {
    if (!analysisDone) {
      handleAnalyze();
    }
    startSimulation();
    setTimeout(() => {
      if (!engineStarted.current) {
        engineStarted.current = true;
        simulationEngine.start(useRuntimeStore.getState);
      }
    }, 50);
  };

  const handlePause = () => {
    pauseSimulation();
  };

  const handleResume = () => {
    resumeSimulation();
  };

  const handleReset = () => {
    simulationEngine.stop();
    engineStarted.current = false;
    setEditorCode("");
    setSyntaxErrors([]);
    setWarningMessage(null);
    setErrorMessage(null);
    setAnalysisDone(false);
    resetSimulation();
  };

  const handleStep = () => {
    if (!analysisDone) {
      handleAnalyze();
    }
    if (!isRunning) {
      startSimulation();
      engineStarted.current = true;
      setTimeout(() => {
        simulationEngine.step(useRuntimeStore.getState);
      }, 50);
    } else {
      simulationEngine.step(useRuntimeStore.getState);
    }
    stepForward();
  };

  const hasQueued = store.microtaskQueue.length > 0 || store.macrotaskQueue.length > 0 || store.callStack.length > 0;
  const canStart = (hasQueued && !isRunning) || analysisDone;
  const canPause = isRunning && !isPaused;
  const canResume = isRunning && isPaused;
  const canStep = (!isRunning && canStart) || (isRunning && isPaused);

  return (
    <AppShell>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div
          className="analyzer-header"
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              JavaScript Event Loop Analyzer
            </h1>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(167, 139, 250, 0.1)",
                color: "var(--micro-primary)",
                border: "1px solid rgba(167, 139, 250, 0.2)",
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              AST & Planner Layer
            </span>
          </div>

          {/* Quick presets row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
              Load preset:
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.code)}
                  disabled={isRunning}
                  style={{
                    fontSize: 10.5,
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    cursor: isRunning ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isRunning) e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isRunning) e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Columns Container */}
        <div className="sim-main-container analyzer-main-container">
          {/* Left Column: Monaco, Controls, Expected Output Terminal */}
          <div className="analyzer-left-column">
            {/* Editor Container */}
            <div
              className="analyzer-editor-card"
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-base)",
                position: "relative",
              }}
            >
              <Editor
                height="280px"
                language="javascript"
                theme="vs-dark"
                value={editorCode}
                onChange={(val) => {
                  setEditorCode(val || "");
                  setAnalysisDone(false);
                }}
                onValidate={handleEditorValidation}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12.5,
                  fontFamily: "JetBrains Mono, monospace",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  lineDecorationsWidth: 8,
                  padding: { top: 8, bottom: 8 },
                }}
              />
            </div>

            {/* Error and Warning Panels */}
            {syntaxErrors.length > 0 && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.08)",
                  borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  fontSize: 11.5,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>⚠</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Fix syntax errors before analysis:</div>
                  {syntaxErrors.map((err, i) => (
                    <div key={i} style={{ opacity: 0.9, fontFamily: "JetBrains Mono, monospace", fontSize: 10.5 }}>
                      Line {err.startLineNumber}: {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.08)",
                  borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  fontSize: 11.5,
                  fontWeight: 500,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>⚠</span>
                <div>{errorMessage}</div>
              </div>
            )}

            {warningMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(245, 158, 11, 0.08)",
                  borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
                  color: "var(--macro-primary)",
                  fontSize: 11.5,
                  fontWeight: 500,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>⚠</span>
                <div>{warningMessage}</div>
              </div>
            )}

            {/* Action Bar (Analyze, Play/Pause/Reset) */}
            <div
              className="analyzer-controls-card"
              style={{
                padding: "14px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Primary Analyze Row */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  id="btn-analyze"
                  className="btn btn-primary"
                  disabled={syntaxErrors.length > 0 || isRunning}
                  onClick={handleAnalyze}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "8px 16px",
                    boxShadow: syntaxErrors.length === 0 && !isRunning ? "0 0 10px rgba(45, 212, 191, 0.2)" : "none",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Analyze Code
                </button>
              </div>

              {/* Simulation Engine Controls */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: "var(--bg-elevated)",
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {/* Start / Run */}
                <button
                  id="btn-start"
                  className="btn btn-success"
                  style={{ width: "100%", justifyContent: "center", gap: 6 }}
                  onClick={handleStart}
                  disabled={!canStart || (isRunning && !isPaused)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Run Simulation
                </button>

                {/* Pause / Resume */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    id="btn-pause"
                    className="btn btn-ghost"
                    style={{ justifyContent: "center", gap: 4 }}
                    onClick={handlePause}
                    disabled={!canPause}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                    Pause
                  </button>
                  <button
                    id="btn-resume"
                    className="btn btn-ghost"
                    style={{ justifyContent: "center", gap: 4 }}
                    onClick={handleResume}
                    disabled={!canResume}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Resume
                  </button>
                </div>

                {/* Step / Reset */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    id="btn-step"
                    className="btn btn-ghost"
                    style={{ justifyContent: "center", gap: 4 }}
                    onClick={handleStep}
                    disabled={!canStep}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 4 15 12 5 20 5 4" />
                      <line x1="19" y1="5" x2="19" y2="19" />
                    </svg>
                    Step
                  </button>
                  <button
                    id="btn-reset"
                    className="btn btn-danger"
                    style={{ justifyContent: "center", gap: 4 }}
                    onClick={handleReset}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-3.2" />
                    </svg>
                    Reset
                  </button>
                </div>

                {/* Speed Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Speed:
                  </span>
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    style={{
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      fontSize: 11,
                      padding: "3px 6px",
                      outline: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {SPEED_MULTIPLIERS.map((mult) => (
                      <option key={mult} value={mult}>
                        {mult}x
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Expected Console Output Panel (Terminal-style) */}
            <div className="analyzer-console-card" style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", minHeight: "220px" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Console Output
              </div>

              <div
                style={{
                  background: "#030712",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
                }}
              >
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
                  {/* Expected Static Prediction Header */}
                  {expectedOutput.length > 0 && (
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
            </div>
          </div>

          {/* Right Column: Dynamic Explanation, Queues Visualizer, and Execution Timeline */}
          <div className="sim-center-column analyzer-right-column">
            {/* StatsPanel shows iteration cards & dynamic educational text */}
            <StatsPanel />

            {/* Core Event Loop visualization */}
            <div className="analyzer-vis-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <VisualizationArea />
            </div>

            {/* Bottom Timeline Card */}
            <div
              className="analyzer-timeline-card"
              style={{
                height: "170px",
                flexShrink: 0,
                minHeight: 0,
                padding: "0 12px 12px 12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="timeline-section-card"
                style={{
                  flex: 1,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div className="bottom-section-title">📊 Execution Timeline</div>
                <div className="timeline-wrapper" style={{ flex: 1, overflowY: "auto" }}>
                  <TimelineView />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styled Blinking Cursor animation */}
      <style jsx global>{`
        @keyframes blink-cursor {
          from, to { background-color: transparent }
          50% { background-color: var(--loop-primary) }
        }
      `}</style>
    </AppShell>
  );
}
