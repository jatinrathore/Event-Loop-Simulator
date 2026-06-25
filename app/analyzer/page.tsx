"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import AppShell from "@/app/_components/layout/AppShell";
import VisualizationArea from "@/app/_components/visualization/VisualizationArea";
import StatsPanel from "@/app/_components/stats/StatsPanel";
import ConsolePanel from "@/app/_components/console/ConsolePanel";
import { useStoreContext as useRuntimeStore, useStoreInstance } from "@/app/_components/StoreProvider";
import { simulationEngine } from "@/app/_lib/engine";
import { parseAndPlan } from "@/app/_lib/analyzer";
import SpeedControl from "@/app/_components/controls/SpeedControl";
import { StoreProvider } from "@/app/_components/StoreProvider";
import { useAnalyzerStore } from "@/app/_lib/store";

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
  return (
    <StoreProvider store={useAnalyzerStore}>
      <CodeAnalyzerContent />
    </StoreProvider>
  );
}

function CodeAnalyzerContent() {
  const storeInstance = useStoreInstance();
  const store = useRuntimeStore((state) => state);
  const {
    analyzerCode,
    setAnalyzerCode,
    loadAnalyzerPreset,
    consoleOutput,
    expectedOutput,
    isRunning,
    isPaused,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    stepForward,
    activeLine,
    guessMode,
    setGuessMode,
  } = store;

  const [editorCode, setEditorCode] = useState(analyzerCode || PRESETS[0].code);
  const [syntaxErrors, setSyntaxErrors] = useState<any[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisDone, setAnalysisDone] = useState(false);

  const engineStarted = useRef(false);
  const hasMounted = useRef(false);
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

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
        simulationEngine.start(storeInstance.getState);
      }
    }
    if (!isRunning) {
      engineStarted.current = false;
      simulationEngine.stop();
    }
  }, [isRunning, isPaused]);

  // Line highlighting effect
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      if (activeLine) {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          [
            {
              range: new monacoRef.current.Range(activeLine, 1, activeLine, 1),
              options: {
                isWholeLine: true,
                className: 'active-line-decoration',
              }
            }
          ]
        );
        editorRef.current.revealLineInCenterIfOutsideViewport(activeLine);
      } else {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
    }
  }, [activeLine]);

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
    if (syntaxErrors.length > 0) return;
    startSimulation();
    setTimeout(() => {
      if (!engineStarted.current) {
        engineStarted.current = true;
        simulationEngine.start(storeInstance.getState);
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
        simulationEngine.step(storeInstance.getState);
      }, 50);
    } else {
      simulationEngine.step(storeInstance.getState);
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
                onMount={handleEditorDidMount}
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
                padding: "10px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
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
                    fontSize: 11,
                    padding: "6px 12px",
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
                  gap: 6,
                  background: "var(--bg-elevated)",
                  padding: "8px",
                  borderRadius: 10,
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {/* Start / Run */}
                <button
                  id="btn-start"
                  className="btn btn-success"
                  style={{ width: "100%", justifyContent: "center", gap: 6, padding: "6px", fontSize: 11 }}
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
                    style={{ justifyContent: "center", gap: 4, padding: "4px", fontSize: 11 }}
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
                    className="btn btn-primary"
                    style={{ justifyContent: "center", gap: 4, padding: "4px", fontSize: 10.5 }}
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  <button
                    id="btn-step"
                    className="btn btn-ghost"
                    style={{ flex: 1, justifyContent: "center", gap: 4, padding: "4px", fontSize: 10.5 }}
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
                    style={{ flex: 1, justifyContent: "center", gap: 4, padding: "4px", fontSize: 10.5 }}
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
                <div style={{ marginTop: 8, padding: "4px" }}>
                  <SpeedControl />
                </div>
              </div>

              {/* Guess Mode Toggle moved to ConsolePanel */}
            </div>

            {/* Moved StatsPanel to left column */}
            <div style={{ padding: "14px" }}>
              <StatsPanel />
            </div>
          </div>

          {/* Right Column: Dynamic Explanation, Queues Visualizer, and Console */}
          <div className="sim-center-column analyzer-right-column">
            {/* Core Event Loop visualization */}
            <div className="analyzer-vis-card" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
              <VisualizationArea />
            </div>

            {/* Console Output (and Guess Mode) */}
            <ConsolePanel />
          </div>
        </div>
      </div>

      {/* Styled Blinking Cursor animation & Line Highlighting */}
      <style jsx global>{`
        @keyframes blink-cursor {
          from, to { background-color: transparent }
          50% { background-color: var(--loop-primary) }
        }
        .active-line-decoration {
          background-color: rgba(167, 139, 250, 0.25) !important;
          border-left: 3px solid #a855f7 !important;
        }
      `}</style>
    </AppShell>
  );
}
