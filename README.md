# nimbusCode: A cloud based code runner

NimbusCode is a browser-based, WebAssembly-powered code runner designed to execute multiple programming languages entirely on the frontend.

It provides an IDE-like experience using Monaco Editor, a resizable output panel, and language runtimes powered by WASM or sandboxed JavaScript execution — with no backend required.

---

## Overview

NimbusCode is built around a simple idea:

> Run real programming languages directly in the browser using WebAssembly and controlled execution environments.

The project focuses on:
- Multi-language support
- Frontend-only execution
- Runtime isolation
- Deterministic output capture
- Clean IDE-style UI

---

## Core Features

- Monaco Editor integration
- Multi-language execution
- WASM-based runtime support
- JavaScript sandbox execution
- Lazy runtime loading
- Resizable editor/output layout
- Terminal-style output buffer
- No backend required
- No server-side code execution

---

## Supported Languages

NimbusCode is designed as a **WASM-based polyglot runner**.

Currently supported:

- **JavaScript**
  - Executed via `new Function()` in a controlled sandbox.
  - Console methods are intercepted and routed to the output panel.

- **Python**
  - Executed using **Pyodide** (Python compiled to WebAssembly).
  - Runtime loaded lazily from CDN.
  - `stdout` and `stderr` captured via `StringIO`.

- **Lua**
  - Executed via WebAssembly (or pure JS runtime depending on configuration).
  - Output captured by overriding `print`.

The architecture allows additional WASM-based languages to be plugged in with minimal changes.

---

## Architecture

NimbusCode runs entirely in the browser.

### Execution Flow

```
Monaco Editor
      ↓
User clicks Run
      ↓
Language dispatcher
      ↓
Selected runtime executes code
      ↓
Captured output
      ↓
Output panel re-renders
```

---

## Execution Model

### JavaScript

- Uses `new Function()` to sandbox execution.
- Injects a proxy `console` object.
- Captures:
  - log
  - error
  - warn
  - table (if implemented)
- Prevents global pollution.

---

### Python (Pyodide)

- Loads Pyodide lazily on first execution.
- Redirects:
  - `sys.stdout`
  - `sys.stderr`
- Executes code asynchronously.
- Extracts buffered output from `StringIO`.

---

### Lua (WASM Runtime)

- Loads runtime dynamically.
- Creates isolated execution environment per run.
- Overrides `print()` to capture output.
- Returns deterministic execution results.

---

## UI Structure

```
App Root
├── Navbar
│   ├── Logo (NimbusCode)
│   ├── Language Dropdown
│   ├── Run Button
│   └── Settings Placeholder
│
└── Split Layout (react-split)
    ├── Monaco Editor
    └── Output Console
```

### Output Panel

- Append-only
- Terminal-style formatting
- Preserves execution history
- Scrollable

---

## Tech Stack

- React (Vite + TypeScript)
- Monaco Editor
- react-split
- Pyodide (WASM Python runtime)
- Lua WASM runtime / JS runtime
- Bun (package manager)

---

## Design Principles

- Frontend-only execution
- Runtime isolation
- Lazy initialization of heavy runtimes
- No uncontrolled global state
- Deterministic output capture
- Minimal dependency surface
- IDE-style UX without backend complexity

---

## Why WASM?

WebAssembly enables:

- Running compiled languages in the browser
- Deterministic execution
- Sandboxed runtime environments
- No server-side execution risk
- Portable language runtimes

NimbusCode uses WASM where appropriate to support real language runtimes without backend infrastructure.

---

## Running the Project

Install dependencies:

```bash
bun install
```

Start dev server:

```bash
bun run dev
```

Open the local Vite URL.

---

## Limitations

- All execution runs on the main thread (no worker isolation yet)
- Infinite loops will freeze the UI
- No filesystem access
- No external module imports
- Runtime initialization delay on first execution
- Not designed for untrusted multi-user environments

---

## Roadmap

- Worker-based execution isolation
- Execution timeouts
- Kill/interrupt support
- Additional WASM language integrations
- Plugin-based runtime architecture
- Persistent file system abstraction
- Tabbed terminal output (stdout / stderr / problems)

---

## Status

NimbusCode is a stable, frontend-only WASM-based code runner prototype with a modular foundation for expanding into a full browser IDE.

