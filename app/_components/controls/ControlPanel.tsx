"use client";

import { useEffect, useRef } from "react";
import { useRuntimeStore } from "@/app/_lib/store";
import { simulationEngine } from "@/app/_lib/engine";
import { SPEED_MULTIPLIERS } from "@/app/_lib/types";

export default function ControlPanel() {
  const store = useRuntimeStore();
  const {
    addMicrotask,
    addMacrotask,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    stepForward,
    setSpeed,
    isRunning,
    isPaused,
    speed,
    microtaskQueue,
    macrotaskQueue,
    callStack,
  } = store;

  const engineStarted = useRef(false);

  // Watch isRunning to trigger engine start/stop
  useEffect(() => {
    if (isRunning && !isPaused) {
      if (!engineStarted.current) {
        engineStarted.current = true;
        // Pass getState function (not a snapshot) so the engine always reads fresh state
        simulationEngine.start(useRuntimeStore.getState);
      }
    }
    if (!isRunning) {
      engineStarted.current = false;
      simulationEngine.stop();
    }
  }, [isRunning, isPaused]);

  // Handle step forward
  const handleStep = () => {
    if (!isRunning) {
      // Start the engine in step mode
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

  const handleStart = () => {
    startSimulation();
    setTimeout(() => {
      if (!engineStarted.current) {
        engineStarted.current = true;
        simulationEngine.start(useRuntimeStore.getState);
      }
    }, 50);
  };

  const handleResume = () => {
    resumeSimulation();
  };

  const handleReset = () => {
    simulationEngine.stop();
    engineStarted.current = false;
    resetSimulation();
  };

  const hasQueued = microtaskQueue.length > 0 || macrotaskQueue.length > 0 || callStack.length > 0;
  const canStart = !isRunning && hasQueued;
  const canPause = isRunning && !isPaused;
  const canResume = isRunning && isPaused;
  const canStep = (!isRunning && hasQueued) || (isRunning && isPaused);

  return (
    <div
      style={{
        width: "var(--control-width)",
        minWidth: "var(--control-width)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Control Panel
        </div>
      </div>

      {/* Add Tasks Section */}
      <div style={{ padding: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
          Add Tasks
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            id="btn-add-microtask"
            className="btn btn-micro"
            style={{ width: "100%" }}
            onClick={addMicrotask}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Add Microtask
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>

          <button
            id="btn-add-macrotask"
            className="btn btn-macro"
            style={{ width: "100%" }}
            onClick={addMacrotask}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Add Macrotask
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Simulation Controls */}
      <div style={{ padding: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
          Simulation
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Start */}
          <button
            id="btn-start"
            className="btn btn-success"
            style={{ width: "100%" }}
            onClick={handleStart}
            disabled={!canStart}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Simulation
          </button>

          {/* Pause / Resume row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <button
              id="btn-pause"
              className="btn btn-ghost"
              onClick={pauseSimulation}
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
              onClick={handleResume}
              disabled={!canResume}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Resume
            </button>
          </div>

          {/* Step Forward */}
          <button
            id="btn-step"
            className="btn btn-ghost"
            style={{ width: "100%" }}
            onClick={handleStep}
            disabled={!canStep}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
            Step Forward
          </button>

          {/* Reset */}
          <button
            id="btn-reset"
            className="btn btn-danger"
            style={{ width: "100%" }}
            onClick={handleReset}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.2" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* Speed Control */}
      <div style={{ padding: "14px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
          Speed
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
          {SPEED_MULTIPLIERS.map((s) => (
            <button
              key={s}
              className="btn btn-ghost"
              style={{
                padding: "6px 2px",
                fontSize: 10,
                background: speed === s ? "var(--stack-bg)" : "transparent",
                borderColor: speed === s ? "var(--stack-primary)" : "var(--border-subtle)",
                color: speed === s ? "var(--stack-primary)" : "var(--text-secondary)",
              }}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>
          {speed === 0.1
            ? "Extremely Slow (7.0s per step)"
            : speed === 0.25
            ? "Very Slow (2.8s per step)"
            : speed === 0.5
            ? "Slow (1.4s per step)"
            : speed === 1
            ? "Normal (700ms per step)"
            : speed === 2
            ? "Fast (350ms per step)"
            : speed === 5
            ? "Very Fast (140ms per step)"
            : "Blazing Fast (70ms per step)"}
        </div>
      </div>
    </div>
  );
}
