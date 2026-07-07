# ⚡ Event Loop Simulator & Code Analyzer

An interactive JavaScript Event Loop learning platform that helps developers understand how the JavaScript runtime actually works.

🔗 Live Demo: https://event-loop-simulator.vercel.app/


## Inspiration

This project started because of a JavaScript Event Loop interview question that completely challenged my understanding of how the Event Loop actually works.

The question was:

> If there are 20 microtasks and 10 macrotasks waiting in their queues, how many Event Loop iterations will be required to execute them all?

At first, the answer seemed obvious.

Then I realized it wasn't.

The answer depends on the current runtime state, the Call Stack state, and how you define an Event Loop iteration. Different scenarios can produce different valid answers.

That single interview question led me down a rabbit hole of researching:

- Event Loop internals
- Microtask draining behavior
- Macrotask scheduling
- Async/Await execution
- Call Stack semantics
- Browser runtime behavior
- Interview edge cases

The deeper I went, the more I realized that most developers understand the Event Loop at a surface level but struggle with execution-order reasoning during interviews.

This simulator was built to make those concepts visible instead of theoretical.

I also wrote a detailed Medium article discussing the original interview question, the different interpretations, the possible answers, and the reasoning behind each one.

📖 Read the full story here:

**Medium Blog:**  
https://medium.com/@rathorejatin168

---

## Why I Built This

While preparing for frontend and JavaScript interviews, I realized that most developers (including myself) understand the Event Loop conceptually but struggle when faced with real-world interview questions involving:

* Promise chains
* Nested microtasks
* queueMicrotask()
* async/await
* setTimeout()
* Call Stack behavior
* Execution order prediction

Most online explanations are static diagrams.

I wanted something interactive where developers can **see** the Event Loop working instead of just reading about it.

---

## Features

### 🎮 Event Loop Simulator

Manually create and visualize:

* Microtasks
* Macrotasks
* Call Stack states
* Nested task creation
* Async execution flow

See tasks move through:

```text
Microtask Queue
        ↓
    Event Loop
        ↓
    Call Stack
        ↓
Execution
```

while observing how JavaScript schedules work internally.

---

### 🧠 Code Analyzer

Paste JavaScript code and visualize:

* Call Stack execution
* Microtask Queue
* Macrotask Queue
* Promise chains
* queueMicrotask()
* async/await continuations
* Console output order

Example:

```js
console.log("A");

Promise.resolve().then(() => {
  console.log("B");
});

console.log("C");
```

Output:

```text
A
C
B
```

The analyzer shows why that happens.

---

### 🎯 Guess Mode

Test your Event Loop knowledge.

1. Paste code
2. Predict output order
3. Run visualization
4. Compare your answer with actual execution

Useful for interview preparation and self-learning.

---

### 📚 Learning Hub

Includes explanations for:

* Event Loop
* Call Stack
* Microtasks
* Macrotasks
* Execution Flow
* Async/Await
* Common Interview Traps

The goal is to teach the runtime model, not just definitions.

---

## Internal Workflow (High Level)

The simulator is not a JavaScript engine and does not attempt to recreate Chrome/V8.

Instead it models the parts of JavaScript required to understand Event Loop behavior.

### Code Analyzer Flow

```text
User Code
    ↓
Monaco Editor
    ↓
Parser / Analyzer
    ↓
Runtime Planner
    ↓
Execution Events
    ↓
Simulation Engine
    ↓
Visualizer
```

### Event Flow

```text
JavaScript Code
        ↓
Identify:
- Sync Tasks
- Microtasks
- Macrotasks
        ↓
Generate Runtime Events
        ↓
Feed Simulation Engine
        ↓
Animate Event Loop
        ↓
Render Output
```

This allows users to understand:

* What enters the Call Stack
* What enters the Microtask Queue
* What enters the Macrotask Queue
* Why a specific execution order occurs

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### UI

* shadcn/ui
* Lucide Icons
* Monaco Editor

### State Management

* Zustand

### Deployment

* Vercel

---

## Event Loop Concepts Covered

### Microtasks

Examples:

```js
Promise.then()
queueMicrotask()
await continuation
```

### Macrotasks

Examples:

```js
setTimeout()
setInterval()
```

### Async / Await

Visualizes:

* Function suspension
* Continuation scheduling
* Call Stack behavior
* Microtask execution

---

## Interview Questions This Helps With

Examples:

* Why does Promise.then() run before setTimeout(..., 0)?
* What happens when a macrotask creates a microtask?
* How does async/await affect the Call Stack?
* What is the difference between queueMicrotask() and Promise.then()?
* When is the Microtask Queue drained?
* How many Event Loop iterations occur for a given code snippet?

---

## Limitations

The analyzer intentionally focuses on Event Loop learning.

Currently it supports common scheduling primitives such as:

* Promise
* Promise chains
* queueMicrotask
* async/await
* setTimeout

It is not intended to fully emulate:

* Browser APIs
* Web Workers
* IndexedDB
* requestAnimationFrame
* Full V8 runtime behavior

---

## AI Assistance

This project was built with significant assistance from AI tools.

AI helped with:

* Architecture brainstorming
* Runtime modeling discussions
* UI/UX iterations
* Documentation
* Testing scenarios
* Educational content

The implementation, product decisions, feature design, debugging, validation, and overall direction were still driven and verified manually.

---

## Feedback

Found an issue or have an idea?

📧 Email: [rathorejatin168@gmail.com](mailto:rathorejatin168@gmail.com)

💻 LinkedIn: https://www.linkedin.com/in/jatinrathore168/

---

Built to make JavaScript's Event Loop easier to understand through visualization rather than memorization.
