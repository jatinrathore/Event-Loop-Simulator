import { describe, it, expect } from "vitest";
import { parseAndPlan } from "./analyzer";

describe("JavaScript Event Loop Code Analyzer - parseAndPlan", () => {
  it("should handle purely synchronous code", () => {
    const code = `
      console.log("A");
      console.log("B");
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["A", "B"]);
    expect(res.tasks).toBeDefined();
    expect(res.tasks![0].label).toContain("global script");
    expect(res.tasks![0].consoleLogs).toEqual(["A", "B"]);
    expect(res.tasks![0].scheduledTasks).toEqual([]);
  });

  it("should handle basic setTimeout macrotasks", () => {
    const code = `
      console.log("start");
      setTimeout(() => {
        console.log("timeout");
      }, 0);
      console.log("end");
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["start", "end", "timeout"]);
    
    const globalTask = res.tasks![0];
    expect(globalTask.consoleLogs).toEqual(["start", "end"]);
    expect(globalTask.scheduledTasks!.length).toBe(1);
    expect(globalTask.scheduledTasks![0].label).toContain("setTimeout");
    expect(globalTask.scheduledTasks![0].consoleLogs).toEqual(["timeout"]);
  });

  it("should handle Promise microtask enqueuing", () => {
    const code = `
      console.log("1");
      Promise.resolve().then(() => {
        console.log("2");
      });
      console.log("3");
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["1", "3", "2"]);

    const globalTask = res.tasks![0];
    expect(globalTask.consoleLogs).toEqual(["1", "3"]);
    expect(globalTask.scheduledTasks!.length).toBe(1);
    expect(globalTask.scheduledTasks![0].label).toContain("Promise.then");
    expect(globalTask.scheduledTasks![0].consoleLogs).toEqual(["2"]);
  });

  it("should handle nested microtasks and promise chains", () => {
    const code = `
      Promise.resolve()
        .then(() => {
          console.log("A");
          Promise.resolve().then(() => {
            console.log("B");
          });
        })
        .then(() => {
          console.log("C");
        });
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    // In actual JS event loop:
    // 1. P0.then is run -> enqueues cb1. Returns P1.
    // 2. P1.then is run -> registers cb3 to run when P1 resolves.
    // 3. Loop: cb1 executes -> prints "A", enqueues cb2 (nested). cb1 returns undefined, which resolves P1.
    // 4. Resolving P1 enqueues cb3.
    // 5. Loop: cb2 executes -> prints "B".
    // 6. Loop: cb3 executes -> prints "C".
    // Order: A, B, C.
    expect(res.expectedOutput).toEqual(["A", "B", "C"]);
  });

  it("should handle queueMicrotask", () => {
    const code = `
      queueMicrotask(() => {
        console.log("micro");
      });
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["micro"]);
  });

  it("should handle async and await flow", () => {
    const code = `
      async function run() {
        console.log("A");
        await Promise.resolve();
        console.log("B");
      }
      run();
      console.log("C");
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    // Execution:
    // 1. run() called -> prints "A".
    // 2. run() hits await -> enqueues continuation. returns promise.
    // 3. print "C".
    // 4. Global script finishes.
    // 5. Microtask (continuation) executes -> prints "B".
    expect(res.expectedOutput).toEqual(["A", "C", "B"]);
  });

  it("should flag syntax errors", () => {
    const code = `
      console.log("missing parenthesis"
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("should warn about unsupported APIs without crashing", () => {
    const code = `
      fetch('https://api.com').then(() => {});
      console.log("OK");
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.warning).toContain("fetch");
    expect(res.expectedOutput).toEqual(["OK"]);
  });

  it("should guard against infinite loops / recursive microtasks", () => {
    const code = `
      function recursive() {
        Promise.resolve().then(recursive);
      }
      recursive();
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Infinite event loop");
  });

  it("should correctly handle the complex nested mixed event loop scenario (regression test)", () => {
    const code = `
      console.log("1");

      setTimeout(() => {
        console.log("2");

        Promise.resolve().then(() => {
          console.log("3");
        });

        queueMicrotask(() => {
          console.log("4");
        });

        setTimeout(() => {
          console.log("5");
        }, 0);
      }, 0);

      Promise.resolve()
        .then(() => {
          console.log("6");

          return Promise.resolve();
        })
        .then(() => {
          console.log("7");

          setTimeout(() => {
            console.log("8");
          }, 0);

          Promise.resolve().then(() => {
            console.log("9");
          });
        });

      queueMicrotask(() => {
        console.log("10");

        queueMicrotask(() => {
          console.log("11");
        });
      });

      (async function () {
        console.log("12");

        await Promise.resolve();

        console.log("13");

        await Promise.resolve();

        console.log("14");
      })();

      console.log("15");
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual([
      "1",
      "12",
      "15",
      "6",
      "10",
      "13",
      "7",
      "11",
      "14",
      "9",
      "2",
      "3",
      "4",
      "8",
      "5"
    ]);
  });

  it("should correctly handle the second complex failing test case with shorthand arrow functions", () => {
    const code = `
      console.log("1");

      setTimeout(() => console.log("2"));

      queueMicrotask(() => {
        console.log("3");

        queueMicrotask(() => {
          console.log("4");
        });

        Promise.resolve().then(() => {
          console.log("5");
        });
      });

      Promise.resolve().then(() => {
        console.log("6");

        queueMicrotask(() => {
          console.log("7");
        });
      });

      console.log("8");
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual([
      "1", "8", "3", "6", "4", "5", "7", "2"
    ]);
  });

  it("should pass Test 1 - Sync Execution with Promise.resolve().then()", () => {
    const code = `
      console.log("A");

      Promise.resolve().then(() => {
        console.log("B");
      });

      console.log("C");
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["A", "C", "B"]);
  });

  it("should pass Test 2 - setTimeout vs Promise.resolve().then()", () => {
    const code = `
      setTimeout(() => {
        console.log("A");
      });

      Promise.resolve().then(() => {
        console.log("B");
      });
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["B", "A"]);
  });

  it("should pass Test 3 - Nested queueMicrotask", () => {
    const code = `
      queueMicrotask(() => {
        console.log("A");

        queueMicrotask(() => {
          console.log("B");
        });
      });
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["A", "B"]);
  });

  it("should pass Test 4 - Nested Promise.resolve().then()", () => {
    const code = `
      Promise.resolve().then(() => {
        console.log("A");

        Promise.resolve().then(() => {
          console.log("B");
        });
      });
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["A", "B"]);
  });

  it("should pass Test 5 - setTimeout schedules Promise.then()", () => {
    const code = `
      setTimeout(() => {
        Promise.resolve().then(() => {
          console.log("A");
        });

        console.log("B");
      });
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["B", "A"]);
  });

  it("should pass Test 6 - queueMicrotask vs Promise.resolve().then() order", () => {
    const code = `
      queueMicrotask(() => {
        console.log("A");
      });

      Promise.resolve().then(() => {
        console.log("B");
      });
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["A", "B"]);
  });

  it("should pass Test 7 - FIFO ordering during microtask draining", () => {
    const code = `
      Promise.resolve().then(() => {
        console.log("A");

        queueMicrotask(() => {
          console.log("B");
        });
      });

      Promise.resolve().then(() => {
        console.log("C");
      });
    `;
    const res = parseAndPlan(code);
    expect(res.success).toBe(true);
    expect(res.expectedOutput).toEqual(["A", "C", "B"]);
  });
});
