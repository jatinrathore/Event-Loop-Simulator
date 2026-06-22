import AppShell from "@/app/_components/layout/AppShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — JS Event Loop Visualizer",
  description: "Learn how the JavaScript Event Loop works: microtasks, macrotasks, call stack, and queue draining.",
};

const RULES = [
  {
    num: 1,
    title: "Call Stack Must Be Empty",
    desc: "The Event Loop only processes tasks when the Call Stack is completely empty. If any function is executing, the Event Loop waits.",
    example: "While main() is running, no async callbacks can execute.",
    color: "var(--stack-primary)",
  },
  {
    num: 2,
    title: "Drain ALL Microtasks First",
    desc: "When the Call Stack empties, the Event Loop drains the entire Microtask Queue before picking any Macrotask — no matter how many microtasks there are.",
    example: "10 Microtasks + 1 Macrotask → all 10 microtasks run before the macrotask.",
    color: "var(--micro-primary)",
  },
  {
    num: 3,
    title: "Macrotasks Can Schedule Microtasks",
    desc: "If a Macrotask adds new Microtasks during its execution, those Microtasks run before the next Macrotask. The queue is re-checked after every Macrotask.",
    example: "T1 runs, schedules M1 → M1 runs before T2.",
    color: "var(--macro-primary)",
  },
  {
    num: 4,
    title: "Never Execute Macrotask With Pending Microtasks",
    desc: "This is a hard rule. A Macrotask will NEVER execute if a single Microtask is still pending. Microtasks always have absolute priority.",
    example: "Even if queued first, a Macrotask waits for every microtask to complete.",
    color: "var(--loop-primary)",
  },
  {
    num: 5,
    title: "Auto-Stop When All Queues Empty",
    desc: "When both the Microtask Queue and Macrotask Queue are empty and the Call Stack is clear, the Event Loop becomes idle and the simulation ends.",
    example: "After the last task completes, status changes to 'Simulation Complete'.",
    color: "#22c55e",
  },
];

const CONCEPTS = [
  {
    name: "Call Stack",
    color: "var(--stack-primary)",
    icon: "</>",
    desc: "A LIFO data structure that tracks function execution. JavaScript is single-threaded — only one function executes at a time. The Event Loop will not process any queued tasks until the stack is empty.",
  },
  {
    name: "Microtask Queue",
    color: "var(--micro-primary)",
    icon: "⚡",
    desc: "High-priority queue that holds microtasks. These are tasks created by Promise.then(), Promise.resolve(), queueMicrotask(), and MutationObserver. ALL microtasks drain before the next macrotask executes.",
  },
  {
    name: "Macrotask Queue",
    color: "var(--macro-primary)",
    icon: "⏱",
    desc: "Standard-priority queue holding macrotasks from APIs like setTimeout(), setInterval(), MessageChannel, and I/O callbacks. Only ONE macrotask is processed per Event Loop iteration.",
  },
  {
    name: "Event Loop",
    color: "var(--loop-primary)",
    icon: "↺",
    desc: "The central orchestrator. It continuously checks: Is the Call Stack empty? → Check Microtask Queue → Drain all microtasks → Execute one Macrotask → Repeat. This loop is the heartbeat of async JavaScript.",
  },
];

export default function DocsPage() {
  return (
    <AppShell>
      <div
        style={{
          height: "100vh",
          overflow: "auto",
          padding: "24px 28px",
        }}
      >
        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              background: "linear-gradient(135deg, #60a5fa, #a78bfa, #34d399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: 8,
            }}
          >
            Understanding the JavaScript Event Loop
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, maxWidth: 640 }}>
            JavaScript is single-threaded but non-blocking. The Event Loop enables asynchronous execution by managing queues of work. This visualizer simulates exactly how it works.
          </p>
        </div>

        {/* Core Concepts */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            Core Concepts
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {CONCEPTS.map((c) => (
              <div
                key={c.name}
                className="glass-card"
                style={{ padding: 16 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${c.color}18`,
                      border: `1px solid ${c.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: c.color,
                      fontWeight: 700,
                    }}
                  >
                    {c.icon}
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: c.color }}>
                    {c.name}
                  </h3>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The 5 Rules */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            The 5 Event Loop Rules
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RULES.map((rule) => (
              <div
                key={rule.num}
                className="glass-card"
                style={{ padding: 16, display: "flex", gap: 14 }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `${rule.color}18`,
                    border: `1.5px solid ${rule.color}55`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: rule.color,
                    flexShrink: 0,
                  }}
                >
                  {rule.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: rule.color, marginBottom: 4 }}>
                    {rule.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 6 }}>
                    {rule.desc}
                  </p>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-subtle)",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    Example: {rule.example}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Execution Order Example */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            Classic Execution Order Example
          </h2>
          <div
            className="glass-card"
            style={{ padding: 16 }}
          >
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
                lineHeight: 2,
                color: "var(--text-secondary)",
              }}
            >
              <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>// Given this queue state:</div>
              <div><span style={{ color: "var(--micro-primary)" }}>Microtasks:</span> [M1, M2, M3]</div>
              <div><span style={{ color: "var(--macro-primary)" }}>Macrotasks:</span> [T1, T2]</div>
              <div style={{ margin: "12px 0", borderTop: "1px dashed var(--border-subtle)" }} />
              <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>// Execution order:</div>
              <div><span style={{ color: "var(--micro-primary)" }}>M1</span> → microtask queue is drained first</div>
              <div><span style={{ color: "var(--micro-primary)" }}>M2</span> → still in microtask queue</div>
              <div><span style={{ color: "var(--micro-primary)" }}>M3</span> → last microtask</div>
              <div><span style={{ color: "var(--macro-primary)" }}>T1</span> → first macrotask (iteration 1→2)</div>
              <div><span style={{ color: "var(--macro-primary)" }}>T2</span> → second macrotask (iteration 2→3)</div>
            </div>
          </div>
        </section>

        {/* Footer tip */}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 10,
            background: "rgba(20, 184, 166, 0.06)",
            border: "1px solid rgba(20, 184, 166, 0.2)",
            fontSize: 12,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--loop-primary)" }}>💡 Pro Tip:</strong>{" "}
          Head to the{" "}
          <a href="/simulator" style={{ color: "var(--stack-primary)", fontWeight: 600, textDecoration: "none" }}>
            Simulator
          </a>{" "}
          and add a mix of microtasks and macrotasks. Watch the Event Loop drain the microtask queue completely before touching a single macrotask — this is the most important concept to internalize for JS interviews.
        </div>
      </div>
    </AppShell>
  );
}
