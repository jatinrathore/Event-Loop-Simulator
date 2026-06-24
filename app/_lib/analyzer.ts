import * as acorn from "acorn";
import { Task, TaskType } from "./types";

// ─── Scope Implementation ───────────────────────────────────────────────────

class Scope {
  parent: Scope | null;
  bindings: Record<string, any>;

  constructor(parent: Scope | null = null) {
    this.parent = parent;
    this.bindings = {};
  }

  get(name: string): any {
    if (name in this.bindings) {
      return this.bindings[name];
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    return undefined;
  }

  set(name: string, val: any) {
    if (name in this.bindings) {
      this.bindings[name] = val;
      return;
    }
    if (this.parent) {
      this.parent.set(name, val);
      return;
    }
    this.bindings[name] = val;
  }

  declare(name: string, val: any) {
    this.bindings[name] = val;
  }
}

// ─── VM / Lexical Interfaces ─────────────────────────────────────────────────

interface Closure {
  type: "function";
  params: string[];
  body: any;
  scope: Scope;
  isAsync: boolean;
}

interface BuiltInCallable {
  type: "builtin";
  name: string;
  execute: (...args: any[]) => any;
}

// Helper to generate IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Global execution variables/states
let activeTask: Task | null = null;
let expectedOutput: string[] = [];
let microtaskCounter = 0;
let macrotaskCounter = 0;
let stepLimitCount = 0;

let virtualMicrotaskQueue: Array<{ task: Task; callback: any }> = [];
let virtualMacrotaskQueue: Array<{ task: Task; callback: any }> = [];

const enqueueMicrotask = (fn: () => void, labelName = "Promise.then()") => {
  microtaskCounter++;
  const label = `${labelName} callback (M${microtaskCounter})`;
  const childTask: Task = {
    id: `task-micro-${generateId()}`,
    label,
    type: "microtask",
    status: "queued",
    createdAt: Date.now(),
    consoleLogs: [],
    scheduledTasks: [],
    executionTicks: [],
    parentId: activeTask?.id || undefined,
  };

  if (activeTask) {
    if (!activeTask.scheduledTasks) activeTask.scheduledTasks = [];
    activeTask.scheduledTasks.push(childTask);
  }

  const callbackClosure = {
    type: "function" as const,
    params: [],
    body: { type: "CustomContinuation", execute: fn },
    scope: new Scope(),
    isAsync: false,
  };

  virtualMicrotaskQueue.push({
    task: childTask,
    callback: callbackClosure,
  });
};

// ─── Virtual Promise Mock ────────────────────────────────────────────────────

class VirtualPromise {
  state: "pending" | "fulfilled" | "rejected" = "pending";
  value: any = undefined;
  deferred: Array<{
    onFulfilled?: any;
    onRejected?: any;
    resolveNext: (val: any) => void;
    rejectNext: (val: any) => void;
  }> = [];

  static resolve(val: any): VirtualPromise {
    if (val instanceof VirtualPromise) return val;
    const p = new VirtualPromise();
    p.state = "fulfilled";
    p.value = val;
    return p;
  }

  resolve(value: any) {
    if (this.state !== "pending") return;
    this.state = "fulfilled";
    this.value = value;
    this.flush();
  }

  reject(reason: any) {
    if (this.state !== "pending") return;
    this.state = "rejected";
    this.value = reason;
    this.flush();
  }

  then(onFulfilled?: any, onRejected?: any): VirtualPromise {
    if (activeTask) {
      if (!activeTask.executionTicks) activeTask.executionTicks = [];
      activeTask.executionTicks.push({ event: "Promise.then Registered", type: "sync" });
    }

    const nextPromise = new VirtualPromise();
    this.deferred.push({
      onFulfilled,
      onRejected,
      resolveNext: (val) => nextPromise.resolve(val),
      rejectNext: (val) => nextPromise.reject(val),
    });
    if (this.state !== "pending") {
      this.flush();
    }
    return nextPromise;
  }

  catch(onRejected?: any): VirtualPromise {
    return this.then(undefined, onRejected);
  }

  finally(onFinally?: any): VirtualPromise {
    return this.then(
      (val: any) => {
        if (onFinally) {
          executeCallbackInVM(onFinally, [], () => {});
        }
        return val;
      },
      (err: any) => {
        if (onFinally) {
          executeCallbackInVM(onFinally, [], () => {});
        }
        throw err;
      }
    );
  }

  private flush() {
    if (this.state === "pending") return;
    const isFulfilled = this.state === "fulfilled";

    while (this.deferred.length > 0) {
      const handler = this.deferred.shift()!;
      enqueueMicrotask(() => {
        try {
          const callback = isFulfilled ? handler.onFulfilled : handler.onRejected;
          if (typeof callback !== "function" && (!callback || (callback.type !== "function" && callback.type !== "builtin"))) {
            // Value forwarding
            if (isFulfilled) {
              handler.resolveNext(this.value);
            } else {
              handler.rejectNext(this.value);
            }
          } else {
            executeCallbackInVM(callback, [this.value], (result) => {
              if (result instanceof VirtualPromise) {
                if (result.state === "fulfilled") {
                  handler.resolveNext(result.value);
                } else if (result.state === "rejected") {
                  handler.rejectNext(result.value);
                } else {
                  result.then(
                    (val: any) => handler.resolveNext(val),
                    (err: any) => handler.rejectNext(err)
                  );
                }
              } else {
                handler.resolveNext(result);
              }
            });
          }
        } catch (err) {
          handler.rejectNext(err);
        }
      }, isFulfilled ? "Promise.then()" : ".catch()");
    }
  }
}

function executeCallbackInVM(callback: any, args: any[], cont: (val: any) => void) {
  if (typeof callback === "function") {
    const res = callback(...args);
    cont(res);
  } else if (callback && callback.type === "builtin") {
    const res = callback.execute(...args);
    cont(res);
  } else if (callback && callback.type === "function") {
    invokeClosure(callback, args, cont);
  } else {
    cont(undefined);
  }
}

function invokeClosure(closure: Closure, args: any[], cont: (val: any) => void) {
  const localScope = new Scope(closure.scope);
  for (let i = 0; i < closure.params.length; i++) {
    localScope.declare(closure.params[i], args[i]);
  }

  if (closure.body.type === "BlockStatement") {
    const bodyNodes = closure.body.body;
    if (closure.isAsync) {
      const wrapperPromise = new VirtualPromise();
      executeStatements(bodyNodes, 0, localScope,
        (lastVal) => {
          wrapperPromise.resolve(lastVal);
        },
        (retVal) => {
          wrapperPromise.resolve(retVal);
        }
      );
      cont(wrapperPromise);
    } else {
      executeStatements(bodyNodes, 0, localScope, cont, cont);
    }
  } else if (closure.body.type === "CustomContinuation") {
    closure.body.execute();
    cont(undefined);
  } else {
    // Shorthand arrow function body is an expression!
    if (closure.isAsync) {
      const wrapperPromise = new VirtualPromise();
      evaluateExpression(closure.body, localScope, (val) => {
        wrapperPromise.resolve(val);
      });
      cont(wrapperPromise);
    } else {
      evaluateExpression(closure.body, localScope, cont);
    }
  }
}

// ─── Evaluator / AST Walkers (CPS Implementation) ──────────────────────────

function evaluateExpression(node: any, scope: Scope, cont: (val: any) => void): void {
  if (!node) {
    cont(undefined);
    return;
  }

  switch (node.type) {
    case "Literal":
      cont(node.value);
      return;

    case "Identifier": {
      const val = scope.get(node.name);
      if (val !== undefined) {
        cont(val);
        return;
      }
      if (node.name === "undefined") {
        cont(undefined);
        return;
      }
      if (node.name === "Promise" || node.name === "console") {
        cont(scope.get(node.name));
        return;
      }
      cont(undefined);
      return;
    }

    case "MemberExpression": {
      evaluateExpression(node.object, scope, (obj) => {
        const propName = node.property.name || node.property.value;
        if (obj instanceof VirtualPromise) {
          if (propName === "then") {
            cont({
              type: "builtin",
              name: "Promise.then",
              execute: (onFulfilled?: any, onRejected?: any) => obj.then(onFulfilled, onRejected),
            });
            return;
          }
          if (propName === "catch") {
            cont({
              type: "builtin",
              name: "Promise.catch",
              execute: (onRejected?: any) => obj.catch(onRejected),
            });
            return;
          }
          if (propName === "finally") {
            cont({
              type: "builtin",
              name: "Promise.finally",
              execute: (onFinally?: any) => obj.finally(onFinally),
            });
            return;
          }
        }
        if (obj && obj.type === "promiseClass" && propName === "resolve") {
          cont({
            type: "builtin",
            name: "Promise.resolve",
            execute: (val: any) => obj.resolve(val),
          });
          return;
        }
        if (obj && obj.type === "console" && propName === "log") {
          cont({
            type: "builtin",
            name: "console.log",
            execute: (...args: any[]) => {
              const msg = args
                .map((arg) => {
                  if (arg === null) return "null";
                  if (arg === undefined) return "undefined";
                  if (typeof arg === "object" && arg.type === "function") return "[Function]";
                  return String(arg);
                })
                .join(" ");

              if (activeTask) {
                if (!activeTask.consoleLogs) activeTask.consoleLogs = [];
                activeTask.consoleLogs.push(msg);
                if (!activeTask.executionTicks) activeTask.executionTicks = [];
                activeTask.executionTicks.push({ event: `console.log("${msg}")`, type: "sync" });
              }
              expectedOutput.push(msg);
            },
          });
          return;
        }
        cont(undefined);
      });
      return;
    }

    case "CallExpression": {
      evaluateExpression(node.callee, scope, (callee) => {
        evaluateArguments(node.arguments, 0, scope, [], (args) => {
          invokeCallee(callee, args, scope, cont);
        });
      });
      return;
    }

    case "ArrowFunctionExpression":
    case "FunctionExpression": {
      cont({
        type: "function",
        params: node.params.map((p: any) => p.name),
        body: node.body,
        scope,
        isAsync: node.async || false,
      });
      return;
    }

    case "AwaitExpression": {
      evaluateExpression(node.argument, scope, (val) => {
        const promise = val instanceof VirtualPromise
          ? val
          : VirtualPromise.resolve(val);

        if (promise.state === "fulfilled") {
          enqueueMicrotask(() => {
            cont(promise.value);
          }, "await continuation");
        } else {
          promise.then((resolvedVal: any) => {
            enqueueMicrotask(() => {
              cont(resolvedVal);
            }, "await continuation");
          });
        }
      });
      return;
    }

    case "BinaryExpression": {
      evaluateExpression(node.left, scope, (left) => {
        evaluateExpression(node.right, scope, (right) => {
          let val;
          switch (node.operator) {
            case "+": val = left + right; break;
            case "-": val = left - right; break;
            case "*": val = left * right; break;
            case "/": val = left / right; break;
            case "==": val = left == right; break;
            case "===": val = left === right; break;
            case "!=": val = left != right; break;
            case "!==": val = left !== right; break;
            default: val = undefined;
          }
          cont(val);
        });
      });
      return;
    }

    case "LogicalExpression": {
      evaluateExpression(node.left, scope, (left) => {
        if (node.operator === "&&") {
          if (!left) {
            cont(left);
          } else {
            evaluateExpression(node.right, scope, cont);
          }
        } else if (node.operator === "||") {
          if (left) {
            cont(left);
          } else {
            evaluateExpression(node.right, scope, cont);
          }
        } else {
          cont(undefined);
        }
      });
      return;
    }

    case "AssignmentExpression": {
      evaluateExpression(node.right, scope, (right) => {
        if (node.left.type === "Identifier") {
          scope.set(node.left.name, right);
          cont(right);
        } else {
          cont(right);
        }
      });
      return;
    }

    default:
      cont(undefined);
      return;
  }
}

function evaluateArguments(nodes: any[], index: number, scope: Scope, acc: any[], cont: (vals: any[]) => void) {
  if (index >= nodes.length) {
    cont(acc);
    return;
  }
  evaluateExpression(nodes[index], scope, (val) => {
    acc.push(val);
    evaluateArguments(nodes, index + 1, scope, acc, cont);
  });
}

// ─── Statement Execution ─────────────────────────────────────────────────────

function invokeCallee(callee: any, args: any[], scope: Scope, cont: (val: any) => void) {
  if (callee && callee.type === "builtin") {
    const res = callee.execute(...args);
    cont(res);
  } else if (callee && callee.type === "function") {
    invokeClosure(callee, args, cont);
  } else {
    cont(undefined);
  }
}

function executeStatement(node: any, scope: Scope, cont: () => void, returnCont: (val: any) => void): void {
  if (stepLimitCount++ > 10000) {
    throw new Error("VM Protection: Maximum AST execution limit exceeded.");
  }

  switch (node.type) {
    case "VariableDeclaration": {
      executeDeclarators(node.declarations, 0, scope, cont);
      return;
    }

    case "ExpressionStatement": {
      evaluateExpression(node.expression, scope, () => {
        cont();
      });
      return;
    }

    case "BlockStatement": {
      const newScope = new Scope(scope);
      executeStatements(node.body, 0, newScope, cont, returnCont);
      return;
    }

    case "FunctionDeclaration": {
      const closure: Closure = {
        type: "function",
        params: node.params.map((p: any) => p.name),
        body: node.body,
        scope,
        isAsync: node.async || false,
      };
      scope.declare(node.id.name, closure);
      cont();
      return;
    }

    case "IfStatement": {
      evaluateExpression(node.test, scope, (testVal) => {
        if (testVal) {
          executeStatement(node.consequent, scope, cont, returnCont);
        } else if (node.alternate) {
          executeStatement(node.alternate, scope, cont, returnCont);
        } else {
          cont();
        }
      });
      return;
    }

    case "ReturnStatement": {
      if (node.argument) {
        evaluateExpression(node.argument, scope, (val) => {
          returnCont(val);
        });
      } else {
        returnCont(undefined);
      }
      return;
    }

    case "CustomContinuation": {
      node.execute();
      return;
    }

    default:
      cont();
      return;
  }
}

function executeDeclarators(declarations: any[], index: number, scope: Scope, cont: () => void) {
  if (index >= declarations.length) {
    cont();
    return;
  }
  const decl = declarations[index];
  if (decl.init) {
    evaluateExpression(decl.init, scope, (val) => {
      scope.declare(decl.id.name, val);
      executeDeclarators(declarations, index + 1, scope, cont);
    });
  } else {
    scope.declare(decl.id.name, undefined);
    executeDeclarators(declarations, index + 1, scope, cont);
  }
}

function executeStatements(statements: any[], index: number, scope: Scope, cont: (val: any) => void, returnCont: (val: any) => void) {
  if (index >= statements.length) {
    cont(undefined);
    return;
  }
  executeStatement(statements[index], scope,
    () => {
      executeStatements(statements, index + 1, scope, cont, returnCont);
    },
    returnCont
  );
}

// ─── Unsupported API Scanner ────────────────────────────────────────────────

const UNSUPPORTED_APIS = [
  "fetch",
  "MutationObserver",
  "Worker",
  "indexedDB",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "BroadcastChannel",
  "SharedArrayBuffer",
  "ReadableStream",
  "WritableStream",
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
];

function scanForUnsupportedAPIs(node: any, warnings: Set<string>) {
  if (!node || typeof node !== "object") return;

  if (node.type === "Identifier" && UNSUPPORTED_APIS.includes(node.name)) {
    warnings.add(node.name);
  }

  for (const key in node) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          scanForUnsupportedAPIs(item, warnings);
        }
      } else {
        scanForUnsupportedAPIs(child, warnings);
      }
    }
  }
}

// ─── Recursive Task Collection Helper ────────────────────────────────────────

function collectTasks(task: Task, list: Task[]) {
  list.push(task);
  if (task.scheduledTasks) {
    for (const child of task.scheduledTasks) {
      collectTasks(child, list);
    }
  }
}

// ─── Main Parser & Planner Entry ─────────────────────────────────────────────

export interface AnalysisResult {
  success: boolean;
  error?: string;
  tasks?: Task[];
  expectedOutput?: string[];
  warning?: string;
  phases?: Array<{ kind: "global-script" | "microtask-drain" | "macrotask"; label: string; taskCount: number }>;
}

export function parseAndPlan(code: string): AnalysisResult {
  if (!code.trim()) {
    return { success: true, tasks: [], expectedOutput: [] };
  }

  let ast: any;
  try {
    ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" });
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  // Scan for unsupported APIs
  const apiWarnings = new Set<string>();
  scanForUnsupportedAPIs(ast, apiWarnings);
  let warningMessage: string | undefined = undefined;
  if (apiWarnings.size > 0) {
    warningMessage = `The following API(s) are not supported by the analyzer yet: ${Array.from(apiWarnings).join(", ")}. Simulation may be incomplete.`;
  }

  // Reset VM state
  expectedOutput = [];
  microtaskCounter = 0;
  macrotaskCounter = 0;
  stepLimitCount = 0;
  virtualMicrotaskQueue = [];
  virtualMacrotaskQueue = [];

  const globalScriptTask: Task = {
    id: "global-script",
    label: "global script (main thread)",
    type: "macrotask",
    status: "queued",
    createdAt: Date.now(),
    consoleLogs: [],
    scheduledTasks: [],
    executionTicks: [],
    parentId: undefined,
  };

  activeTask = globalScriptTask;

  // Initialize Global Scope
  const globalScope = new Scope();
  globalScope.declare("console", { type: "console" });

  const timeoutFn = (cbClosure: any) => {
    macrotaskCounter++;
    const label = `setTimeout() callback (T${macrotaskCounter})`;
    const childTask: Task = {
      id: `task-macro-${generateId()}`,
      label,
      type: "macrotask",
      status: "queued",
      createdAt: Date.now(),
      consoleLogs: [],
      scheduledTasks: [],
      executionTicks: [],
      parentId: activeTask?.id || undefined,
    };

    if (activeTask) {
      if (!activeTask.scheduledTasks) activeTask.scheduledTasks = [];
      activeTask.scheduledTasks.push(childTask);
      if (!activeTask.executionTicks) activeTask.executionTicks = [];
      activeTask.executionTicks.push({ event: "setTimeout Registered", type: "sync" });
    }

    virtualMacrotaskQueue.push({
      task: childTask,
      callback: cbClosure,
    });
  };

  const queueMicrotaskFn = (cbClosure: any) => {
    if (activeTask) {
      if (!activeTask.executionTicks) activeTask.executionTicks = [];
      activeTask.executionTicks.push({ event: "queueMicrotask Registered", type: "sync" });
    }
    enqueueMicrotask(() => {
      executeCallbackInVM(cbClosure, [], () => {});
    }, "queueMicrotask()");
  };

  globalScope.declare("setTimeout", {
    type: "builtin",
    name: "setTimeout",
    execute: (cb: any) => timeoutFn(cb),
  });

  globalScope.declare("queueMicrotask", {
    type: "builtin",
    name: "queueMicrotask",
    execute: (cb: any) => queueMicrotaskFn(cb),
  });

  globalScope.declare("Promise", {
    type: "promiseClass",
    resolve: (val: any) => VirtualPromise.resolve(val),
  });

  try {
    // Record start tick
    globalScriptTask.executionTicks!.push({ event: "Global Script Started", type: "system" });

    // 1. Execute synchronous global script
    executeStatements(ast.body, 0, globalScope, () => {}, () => {});
    
    // Record end tick
    globalScriptTask.executionTicks!.push({ event: "Global Script Finished", type: "system" });

    // 2. virtual event loop simulation
    let virtualTasksCount = 0;
    const phases: Array<{ kind: "global-script" | "microtask-drain" | "macrotask"; label: string; taskCount: number }> = [];

    // Prepend the Global Script phase
    phases.push({
      kind: "global-script",
      label: "Global Script",
      taskCount: 1,
    });

    while (virtualMicrotaskQueue.length > 0 || virtualMacrotaskQueue.length > 0) {
      if (virtualTasksCount > 2000) {
        throw new Error("Unable to analyze this code pattern yet: Infinite event loop execution detected.");
      }

      if (virtualMicrotaskQueue.length > 0) {
        let taskCount = 0;
        const phaseIndex = phases.length;
        phases.push({
          kind: "microtask-drain",
          label: "",
          taskCount: 0,
        });

        // Drain microtasks sequentially, including microtasks queued during this drain phase
        while (virtualMicrotaskQueue.length > 0) {
          virtualTasksCount++;
          if (virtualTasksCount > 2000) {
            throw new Error("Unable to analyze this code pattern yet: Infinite event loop execution detected.");
          }

          const item = virtualMicrotaskQueue.shift()!;
          taskCount++;
          activeTask = item.task;
          executeCallbackInVM(item.callback, [], () => {});
        }

        phases[phaseIndex].taskCount = taskCount;
        phases[phaseIndex].label = `Drain ${taskCount} Microtask${taskCount > 1 ? "s" : ""}`;
      } else if (virtualMacrotaskQueue.length > 0) {
        virtualTasksCount++;
        const item = virtualMacrotaskQueue.shift()!;
        phases.push({
          kind: "macrotask",
          label: item.task.label,
          taskCount: 1,
        });

        activeTask = item.task;
        executeCallbackInVM(item.callback, [], () => {});
      }
    }

    // Wrap globalScriptTask as a completed Call Stack entry
    globalScriptTask.status = "executing";

    const allTasks: Task[] = [];
    collectTasks(globalScriptTask, allTasks);

    return {
      success: true,
      tasks: allTasks,
      expectedOutput: [...expectedOutput],
      warning: warningMessage,
      phases,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unable to analyze this code pattern yet: ${err.message}`,
    };
  }
}
