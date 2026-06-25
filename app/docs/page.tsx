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
    desc: "A Macrotask will NEVER execute if a single Microtask is still pending. Because the Event Loop must fully drain the Microtask Queue before moving to the next Macrotask, continuously scheduling new microtasks can theoretically create an infinite chain and starve macrotasks.",
    example: "⚠️ Microtask Starvation: queueMicrotask scheduling itself infinitely will block macrotasks forever.",
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
    desc: "The central orchestrator. It follows a specific sequence: Call Stack Empty → Drain Microtasks → Browser may Render → Next Macrotask → Repeat. This loop is the heartbeat of async JavaScript.",
  },
  {
    name: "Async/Await",
    color: "#ec4899",
    icon: "⏸",
    desc: "Syntactic sugar built on top of Promises. `await` suspends the execution of the current function and schedules the continuation as a microtask, without blocking the main thread.",
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
            JavaScript is single-threaded but non-blocking. The Event Loop enables asynchronous execution by managing queues of work. This visualizer models the <strong style={{ color: "var(--text-primary)" }}>Browser Event Loop</strong>.
          </p>
          <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", maxWidth: 640, lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-primary)" }}>Node.js vs Browser:</strong> The Node.js Event Loop is not identical to the browser's. Node.js adds distinct phases (timers, pending callbacks, poll, check, close callbacks) and includes <code>process.nextTick()</code>, which runs before normal Promise microtasks.
          </div>
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
                      background: c.name === "Async/Await" ? "transparent" : `${c.color}18`,
                      border: c.name === "Async/Await" ? "none" : `1px solid ${c.color}44`,
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
              <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>{"// Given this queue state:"}</div>
              <div><span style={{ color: "var(--micro-primary)" }}>Microtasks:</span> [M1, M2, M3]</div>
              <div><span style={{ color: "var(--macro-primary)" }}>Macrotasks:</span> [T1, T2]</div>
              <div style={{ margin: "12px 0", borderTop: "1px dashed var(--border-subtle)" }} />
              <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>{"// Execution order:"}</div>
              <div><span style={{ color: "var(--micro-primary)" }}>M1</span> → microtask queue is drained first</div>
              <div><span style={{ color: "var(--micro-primary)" }}>M2</span> → still in microtask queue</div>
              <div><span style={{ color: "var(--micro-primary)" }}>M3</span> → last microtask</div>
              <div><span style={{ color: "var(--macro-primary)" }}>T1</span> → first macrotask (iteration 1→2)</div>
              <div><span style={{ color: "var(--macro-primary)" }}>T2</span> → second macrotask (iteration 2→3)</div>
            </div>
          </div>
        </section>

        {/* Async/Await Learning Module */}
        <div style={{ marginTop: 64, marginBottom: 36, borderTop: "1px solid var(--border-subtle)", paddingTop: 36 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              background: "linear-gradient(135deg, #a855f7, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: 8,
            }}
          >
            Async/Await Deep Dive
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, maxWidth: 640, marginBottom: 32 }}>
            Understanding how <code style={{ color: "var(--text-primary)", background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: 4 }}>async/await</code> behaves under the hood is crucial for mastering modern JavaScript. It changes the syntax, but it does not change the Event Loop.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            {/* Section 1 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>1. What is Async/Await?</h3>
              <div className="glass-card" style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
                  <strong style={{ color: "var(--text-primary)" }}>async/await</strong> is syntax built on top of Promises. It does not replace Promises. It makes asynchronous code look synchronous, but the Event Loop behavior remains exactly the same.
                </p>
                <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-secondary)" }}>
                  <div style={{ color: "var(--keyword)" }}>async function</div> <span style={{ color: "var(--function)" }}>fetchData</span>() {"{"}
                  <div style={{ paddingLeft: 16 }}>
                    <span style={{ color: "var(--keyword)" }}>const</span> result = <span style={{ color: "var(--keyword)" }}>await</span> Promise.<span style={{ color: "var(--function)" }}>resolve</span>(<span style={{ color: "var(--string)" }}>"Hello"</span>);<br/>
                    console.<span style={{ color: "var(--function)" }}>log</span>(result);
                  </div>
                  {"}"}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 12 }}>
                  The code looks synchronous, but under the hood it still uses Promise-based scheduling. 
                  <br/><br/>
                  <strong style={{ color: "var(--text-primary)" }}>Note:</strong> Even if the Promise is already resolved (like <code>Promise.resolve()</code>), the code after <code>await</code> is still deferred to a future Microtask.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>2. Async/Await Lifecycle</h3>
              <div className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Code Example</h4>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-secondary)" }}>
                      <div style={{ color: "var(--keyword)" }}>async function</div> <span style={{ color: "var(--function)" }}>example</span>() {"{"}
                      <div style={{ paddingLeft: 16 }}>
                        console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"Inside async start"</span>);<br/><br/>
                        <span style={{ color: "var(--keyword)" }}>await</span> Promise.<span style={{ color: "var(--function)" }}>resolve</span>();<br/><br/>
                        console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"After await"</span>);
                      </div>
                      {"}"}<br/><br/>
                      console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"Global start"</span>);<br/>
                      <span style={{ color: "var(--function)" }}>example</span>();<br/>
                      console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"Global end"</span>);
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Expected Output</h4>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                      <div>1. Global start</div>
                      <div>2. Inside async start</div>
                      <div>3. Global end</div>
                      <div>4. After await</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>3. Call Stack Behavior</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>This is the most important part. Visually understand what happens when execution reaches an <code style={{ color: "var(--text-primary)", background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: 4 }}>await</code>.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  {
                    step: 1,
                    desc: "Executing: console.log('Inside async start');",
                    stack: ["example()", "Global Script"],
                    queue: []
                  },
                  {
                    step: 2,
                    desc: "Execution reaches: await Promise.resolve();\n\n• The execution context is suspended and its state is preserved.\n• The Call Stack frame is removed.\n• Continuation is scheduled as a Microtask.",
                    stack: ["Global Script"],
                    queue: []
                  },
                  {
                    step: 3,
                    desc: "Global Script continues.\nExecuting: console.log('Global end');",
                    stack: ["Global Script"],
                    queue: []
                  },
                  {
                    step: 4,
                    desc: "Global Script finishes.",
                    stack: ["(empty)"],
                    queue: ["example() continuation"]
                  },
                  {
                    step: 5,
                    desc: "Microtask executes. \n\nWhen the awaited Promise settles, execution resumes from the saved state via a Microtask.\nExecuting: console.log('After await');",
                    stack: ["example() continuation"],
                    queue: []
                  }
                ].map(s => (
                  <div key={s.step} className="glass-card" style={{ padding: 16, display: "flex", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--loop-primary)", marginBottom: 8 }}>Step {s.step}</h4>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{s.desc}</p>
                    </div>
                    <div style={{ width: 180, flexShrink: 0, background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--stack-primary)", marginBottom: 6, textTransform: "uppercase" }}>Call Stack:</div>
                      {s.stack.map(st => <div key={st} style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--text-secondary)" }}>{st}</div>)}
                      
                      {s.queue.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--micro-primary)", marginBottom: 6, textTransform: "uppercase" }}>Microtask Queue:</div>
                          {s.queue.map(q => <div key={q} style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--text-secondary)" }}>{q}</div>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>4. Suspension & Resume Visualization</h3>
              <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                {[
                  { text: "example() executes synchronously", color: "var(--text-primary)" },
                  { text: "↓", color: "var(--text-muted)" },
                  { text: "await reached", color: "var(--loop-primary)" },
                  { text: "↓", color: "var(--text-muted)" },
                  { text: "function suspended (removed from stack)", color: "var(--stack-primary)" },
                  { text: "↓", color: "var(--text-muted)" },
                  { text: "continuation queued as Microtask", color: "var(--micro-primary)" },
                  { text: "↓", color: "var(--text-muted)" },
                  { text: "Call Stack empties, microtask executes", color: "var(--text-secondary)" },
                  { text: "↓", color: "var(--text-muted)" },
                  { text: "function resumes execution", color: "#34d399" },
                ].map((item, idx) => (
                  <div key={idx} style={{ fontSize: 13, fontWeight: item.text === "↓" ? 400 : 700, color: item.color, fontFamily: item.text === "↓" ? "sans-serif" : "JetBrains Mono, monospace" }}>
                    {item.text}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>5. Async/Await vs Promises</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-secondary)" }}>
                  <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>// Async/Await syntax</div>
                  <div style={{ color: "var(--keyword)" }}>async function</div> <span style={{ color: "var(--function)" }}>demo</span>() {"{"}<br/>
                  <div style={{ paddingLeft: 16 }}>
                    <span style={{ color: "var(--keyword)" }}>await</span> promise;<br/>
                    console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"after"</span>);
                  </div>
                  {"}"}
                </div>
                <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-secondary)" }}>
                  <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>// Promise.then() equivalent</div>
                  <div style={{ color: "var(--keyword)" }}>function</div> <span style={{ color: "var(--function)" }}>demo</span>() {"{"}<br/>
                  <div style={{ paddingLeft: 16 }}>
                    <span style={{ color: "var(--keyword)" }}>return</span> promise.<span style={{ color: "var(--function)" }}>then</span>(() =&gt; {"{"}<br/>
                    <div style={{ paddingLeft: 16 }}>
                      console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"after"</span>);
                    </div>
                    {"});"}
                  </div>
                  {"}"}
                </div>
              </div>

              <div className="glass-card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 700 }}>Topic</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 700 }}>Promises</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 700 }}>Async/Await</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Syntax", ".then() chaining", "await keyword"],
                      ["Readability", "Nested callbacks", "Looks synchronous"],
                      ["Chaining", "Return another Promise", "Sequence awaits naturally"],
                      ["Error Handling", ".catch()", "try / catch"],
                      ["Event Loop Behavior", "Microtask Queue", "Microtask Queue"],
                      ["Underlying Mechanism", "Callbacks executed later", "Function suspended and resumed later"],
                    ].map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 600 }}>{row[0]}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{row[1]}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, padding: 12, background: "rgba(236, 72, 153, 0.1)", borderLeft: "3px solid #ec4899", borderRadius: 4 }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <strong style={{ color: "#ec4899" }}>Important:</strong> Async/Await introduces no new scheduling mechanism. It is built on top of Promises and uses the same Microtask Queue for resuming execution.
                </p>
              </div>
            </section>

            {/* Section 6 - Pro Tip */}
            <section>
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: "rgba(52, 211, 153, 0.1)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pro Tip</h3>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Many developers think async/await executes differently from Promises. This is incorrect. Code after an await is scheduled as a Microtask, just like Promise.then() callbacks. The Event Loop treats both using the Microtask Queue. Async/Await improves readability, not scheduling priority.
                </p>
              </div>
            </section>

            {/* Section 7 - Interview Traps */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>7. Interview Traps</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="glass-card" style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Question 1: What is the output?</h4>
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-secondary)" }}>
                        <div style={{ color: "var(--keyword)" }}>async function</div> <span style={{ color: "var(--function)" }}>run</span>() {"{"}
                        <div style={{ paddingLeft: 16 }}>
                          console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"1"</span>);<br/><br/>
                          <span style={{ color: "var(--keyword)" }}>await</span> Promise.<span style={{ color: "var(--function)" }}>resolve</span>();<br/><br/>
                          console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"2"</span>);
                        </div>
                        {"}"}<br/><br/>
                        console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"3"</span>);<br/>
                        <span style={{ color: "var(--function)" }}>run</span>();<br/>
                        console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"4"</span>);
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Reveal</h4>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--text-primary)", fontWeight: 700, letterSpacing: "0.1em" }}>
                          3 → 1 → 4 → 2
                        </div>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Explanation</h4>
                        <ul style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.6, margin: 0 }}>
                          <li><code style={{ color: "var(--text-primary)" }}>run()</code> starts synchronously.</li>
                          <li><code style={{ color: "var(--text-primary)" }}>await</code> suspends execution.</li>
                          <li>Remaining code becomes a Microtask.</li>
                          <li>Global script continues.</li>
                          <li>Microtask executes later.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Question 2: queueMicrotask vs setTimeout</h4>
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--function)" }}>setTimeout</span>(() =&gt; console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"timeout"</span>));<br/><br/>
                        <span style={{ color: "var(--function)" }}>queueMicrotask</span>(() =&gt; console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"microtask"</span>));<br/><br/>
                        console.<span style={{ color: "var(--function)" }}>log</span>(<span style={{ color: "var(--string)" }}>"sync"</span>);
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Reveal</h4>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--text-primary)", fontWeight: 700, letterSpacing: "0.1em" }}>
                          sync → microtask → timeout
                        </div>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Explanation</h4>
                        <ul style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.6, margin: 0 }}>
                          <li><code style={{ color: "var(--text-primary)" }}>queueMicrotask</code> goes to the Microtask Queue.</li>
                          <li><code style={{ color: "var(--text-primary)" }}>setTimeout</code> goes to the Macrotask Queue.</li>
                          <li><strong style={{ color: "var(--text-primary)" }}>Microtasks always execute first</strong> before the Event Loop moves to the next Macrotask.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8 - Common Misconceptions */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>8. Common Misconceptions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { myth: "await blocks JavaScript", truth: "It only suspends the specific async function. The rest of the Event Loop and global script continue running freely." },
                  { myth: "async functions stay on the Call Stack while waiting", truth: "The execution context is suspended and its state is preserved. The Call Stack frame is removed. When the awaited Promise settles, execution resumes from the saved state via a Microtask." },
                  { myth: "async/await is faster than Promises", truth: "They both use the exact same underlying Promise engine and Microtask Queue." },
                  { myth: "await creates a Macrotask", truth: "await schedules the continuation as a Microtask, which has higher priority than Macrotasks like setTimeout." }
                ].map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: 16, display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 18, marginTop: -2 }}>❌</div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>{item.myth}</h4>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.truth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

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
