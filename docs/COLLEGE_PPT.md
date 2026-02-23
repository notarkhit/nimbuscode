# NimbusCode PPT Content

## Abstract

NimbusCode is a browser-based coding environment that removes the need for local compiler/runtime installation. It enables students to create files, write code, and execute programs directly in the browser using WebAssembly-backed runtimes. The project is designed as a frontend-only system, with no backend dependency for code execution or storage. Workspace data is persisted locally through IndexedDB. This approach improves accessibility and reduces setup overhead in academic programming environments.

## Introduction

Programming beginners often face environment setup issues before they can start learning core concepts. NimbusCode addresses this challenge by offering an IDE-like interface in the browser with multi-language support, file management, and runtime execution.

### I. Problem Statement

Traditional programming workflows require:

1. Installing language runtimes and compilers.
2. Managing OS-specific toolchain differences.
3. Resolving dependency and PATH issues.
4. Maintaining development environments across lab systems.

These steps increase friction and reduce learning focus.

### II. Motivation

The project is motivated by the need to:

1. Minimize setup time for students.
2. Provide a consistent environment across devices.
3. Enable quick experimentation for multiple languages.
4. Build a lightweight educational coding platform without backend complexity.

## Architecture Diagram

```mermaid
flowchart LR
    U[User] --> UI[React UI]
    UI --> EX[Explorer]
    UI --> ED[Monaco Editor]
    UI --> CN[Console]
    UI --> ST[Settings Tab]

    EX --> WS[Workspace Manager]
    WS --> IDB[(IndexedDB)]

    ED --> LM[Language Mapper]
    LM --> RM[Runtime Mapper]
    RM --> RT[Runtime Layer]
    RT --> WA[WebAssembly Execution]

    WA --> JS[quickjs]
    WA --> PY[python]
    WA --> C[clang]
    WA --> CPP[clangpp]
    WA --> PHP[php-cgi]
    WA --> SQL[sqlite]
    WA --> RB[ruby]

    RT --> CN
```

## Literature Review

For NimbusCode, the literature review focused on practical patterns used in browser-native coding platforms:

1. Browser IDE UI pattern: explorer + tabbed editor + output panel.
2. In-browser execution pattern: WebAssembly-backed runtimes for multi-language support.
3. Local-first persistence pattern: IndexedDB storage for files/folders without server-side storage.
4. Beginner-focused DX pattern: runtime auto-selection by file extension to reduce setup complexity.

These patterns directly informed the current repository implementation (`src/App.tsx`, `src/fileStore.ts`, `vite.config.ts`).

## Design Methodology

1. Analyze educational requirements for a no-setup coding platform.
2. Design a modular frontend architecture:
   - UI/interaction layer in `src/App.tsx`
   - Persistence layer in `src/fileStore.ts`
   - Styling system in `src/App.css` and `src/index.css`
3. Implement extension-based runtime mapping (`runtimeByExtension`) and language labeling.
4. Implement runtime execution pipeline:
   - Interpreted runtimes via `interactiveRunCode`
   - C/C++ compile pipeline (`clang`/`wasm-ld`) using WASI APIs
5. Integrate workspace persistence with IndexedDB CRUD (`list`, `put`, `delete`).
6. Validate with functional workflow checks (create/edit/delete/run/reload) and build-quality checks (`lint`, `build`).

## Schema Structure

NimbusCode uses a lightweight local schema in IndexedDB:

1. Database name: `nimbuscode-workspace`
2. Object store: `entries`
3. Key path: `path`
4. Entry variants:
   - `file`: `{ path, kind: "file", content, updatedAt }`
   - `folder`: `{ path, kind: "folder", updatedAt }`

The schema supports hierarchical paths (example: `/src/main.py`) and local-first persistence without backend APIs.

Repository structure command reference:

```bash
# Command requested in prompt (BSD/macOS style)
ls -TDL 2

# Linux-compatible equivalent used during repository analysis
find . -maxdepth 2 -type d | sort
```

## Results

1. Frontend-only code execution across multiple languages achieved.
2. IDE-like workflow implemented: file explorer, tabs, run, console.
3. Runtime/language detection via file extension implemented.
4. Local data persistence across sessions implemented.
5. Error handling consolidated into console for clearer runtime feedback.

## Evaluation and Comparison/ Validation

### Validation

1. File operations: create/open/delete and reload persistence verified.
2. Execution pipeline: runtime mapping and output rendering verified.
3. UI workflow: tab behavior and settings tab flow verified.
4. Quality checks: lint and production build pass.

### Comparison (Conceptual)

Compared to traditional local IDE setup:

1. Setup overhead: significantly reduced.
2. Environment consistency: higher (browser-standardized).
3. Infrastructure need: lower (no backend required).
4. Advanced tooling depth: currently lower than full desktop IDEs.

## Scope for Future Enhancement

1. Functional keybinding engines (Vim/Emacs).
2. Rich diagnostics and per-language linting overlays.
3. Execution interrupt/timeout controls.
4. Workspace import/export and optional sync.
5. Enhanced SQL interactivity and query helpers.
6. Broader language tooling and semantic assistance.

## Conclusion

NimbusCode successfully demonstrates a no-backend, WebAssembly-based educational coding environment that reduces setup friction and improves accessibility for learners. The project provides a stable foundation with practical multi-language execution and local persistence. With incremental improvements in tooling and diagnostics, it can evolve into a stronger browser-native IDE platform for academic use.
