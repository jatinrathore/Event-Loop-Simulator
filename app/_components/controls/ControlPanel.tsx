"use client";

import { useEffect, useRef, useState } from "react";
import { useRuntimeStore } from "@/app/_lib/store";
import { simulationEngine } from "@/app/_lib/engine";
import { SPEED_MULTIPLIERS, CallStackScenario, TaskType } from "@/app/_lib/types";
import ScenarioPresets from "./ScenarioPresets";

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
    callStackScenario,
    setCallStackScenario,
  } = store;

  // Inline scheduling config state (set before adding task to queue)
  const [microSchedules, setMicroSchedules] = useState(false);
  const [macroSchedules, setMacroSchedules] = useState(false);
  const [macroScheduleType, setMacroScheduleType] = useState<TaskType>("microtask");

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
  const canStart = !isRunning && (hasQueued || callStackScenario === "busy-sync");
  const canPause = isRunning && !isPaused;
  const canResume = isRunning && isPaused;
  const canStep = (!isRunning && (hasQueued || callStackScenario === "busy-sync")) || (isRunning && isPaused);

  return (
    <div className="control-panel-container">
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* ── Microtask ── */}
          <div>
            <button
              id="btn-add-microtask"
              className="btn btn-micro"
              style={{ width: "100%" }}
              disabled={isRunning}
              onClick={() => {
                addMicrotask(microSchedules ? { type: "microtask" } : null);
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Add Microtask
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </button>
            {/* Inline schedule option */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 5,
                paddingLeft: 2,
                fontSize: 10.5,
                color: microSchedules ? "var(--micro-primary)" : "var(--text-muted)",
                cursor: isRunning ? "not-allowed" : "pointer",
                userSelect: "none",
                transition: "color 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={microSchedules}
                disabled={isRunning}
                onChange={(e) => setMicroSchedules(e.target.checked)}
                style={{ accentColor: "var(--micro-primary)", cursor: "pointer" }}
              />
              Schedules callback
              {microSchedules && (
                <span style={{ marginLeft: 4, fontWeight: 700, fontSize: 10, color: "var(--micro-primary)" }}>
                  ⚡ Microtask
                </span>
              )}
            </label>
          </div>

          {/* ── Macrotask ── */}
          <div>
            <button
              id="btn-add-macrotask"
              className="btn btn-macro"
              style={{ width: "100%" }}
              disabled={isRunning}
              onClick={() => {
                addMacrotask(macroSchedules ? { type: macroScheduleType } : null);
              }}
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
            {/* Inline schedule option */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, paddingLeft: 2 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10.5,
                  color: macroSchedules ? "var(--macro-primary)" : "var(--text-muted)",
                  cursor: isRunning ? "not-allowed" : "pointer",
                  userSelect: "none",
                  transition: "color 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={macroSchedules}
                  disabled={isRunning}
                  onChange={(e) => setMacroSchedules(e.target.checked)}
                  style={{ accentColor: "var(--macro-primary)", cursor: "pointer" }}
                />
                Schedules callback
              </label>
              {macroSchedules && (
                <select
                  value={macroScheduleType}
                  disabled={isRunning}
                  onChange={(e) => setMacroScheduleType(e.target.value as TaskType)}
                  style={{
                    background: "var(--bg-surface)",
                    color: macroScheduleType === "microtask" ? "var(--micro-primary)" : "var(--macro-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 4,
                    fontSize: 10,
                    padding: "1px 4px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  <option value="microtask">⚡ Microtask</option>
                  <option value="macrotask">⏱ Macrotask</option>
                </select>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Call Stack Scenario */}
      <div style={{ padding: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
          Call Stack Scenario
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(["empty", "busy-sync"] as CallStackScenario[]).map((scen) => {
            const label = scen === "empty"
              ? "Call Stack Empty"
              : "Call Stack Busy (Sync Code)";
            return (
              <label
                key={scen}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  cursor: isRunning ? "not-allowed" : "pointer",
                  color: callStackScenario === scen ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                <input
                  type="radio"
                  name="callStackScenario"
                  value={scen}
                  checked={callStackScenario === scen}
                  onChange={() => setCallStackScenario(scen)}
                  disabled={isRunning}
                  style={{
                    accentColor: "var(--stack-primary)",
                    cursor: isRunning ? "not-allowed" : "pointer",
                  }}
                />
                {label}
              </label>
            );
          })}
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
      <div style={{ padding: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
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

      {/* Presets */}
      <ScenarioPresets />
    </div>
  );
}
