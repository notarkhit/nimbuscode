# NimbusCode

NimbusCode is a browser IDE for learning and experimenting with code, without local compiler/runtime setup.

Everything runs on the frontend through WebAssembly-backed runtimes. There is no backend service, no server-side execution, and no API layer required to use the app.

## Why this project

Learning programming is often blocked by installation and toolchain setup. NimbusCode removes that friction:

- write code in the browser
- run it directly in the browser
- keep files locally in browser storage
- avoid backend infrastructure entirely

## How it works

1. You create/open files in the left explorer.
2. Files open in editor tabs (Monaco).
3. Runtime is detected from the file extension.
4. Code executes in browser runtimes powered by WebAssembly.
5. Output appears in the bottom terminal panel (including interactive input when supported).

For C/C++, NimbusCode compiles source to a WASM binary in-browser, then runs that binary in a WASI environment.

## Supported languages and file mapping

| Language | Extensions | Runtime mapping |
| --- | --- | --- |
| JavaScript | `.js`, `.mjs`, `.cjs` | `quickjs` |
| Python | `.py` | `python` |
| C | `.c` | `clang` |
| C++ | `.cpp`, `.cc`, `.cxx` | `clangpp` |
| PHP | `.php` | `php-cgi` |
| SQLite | `.sql` | `sqlite` |
| Ruby | `.rb` | `ruby` |

## Current UI/features

- VS Code-style split layout:
  - left explorer
  - editor area (tabbed)
  - output console
- File + folder create/delete from explorer
- Inline file/folder creation input (no browser prompt)
- Monaco editor with Tokyo Night theming
- Language indicator + supported-languages dropdown
- Run button with runtime status
- Output terminal with clear action
- Settings button placeholder (non-functional)
- Icons via `lucide-react`

## Persistence model

Workspace files/folders are stored in IndexedDB:

- DB name: `nimbuscode-workspace`
- Object store: `entries`
- Keys: file/folder `path`

This means your workspace stays in your browser between reloads, without any backend database.

## Tech stack

- Bun
- Vite + React + TypeScript
- Monaco Editor (`@monaco-editor/react`)
- Split panes (`react-split`)
- WebAssembly runtimes + WASI execution (`@runno/runtime`, `@runno/wasi`)
- IndexedDB (browser local storage)

## No backend required

NimbusCode is frontend-only by design:

- no auth server
- no API server
- no code execution server
- no cloud database

You can host the built static files on any static hosting platform.

## Deployment requirement (important)

Runno needs `SharedArrayBuffer`, which only works when the deployed site is
cross-origin isolated.

Your deployed HTML response must include:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

This repo already includes:

- `vercel.json` for Vercel deployments
- `public/_headers` for platforms that support `_headers` (for example Netlify /
  Cloudflare Pages static headers)

After deploying, open browser devtools on the deployed app and verify:

```js
window.crossOriginIsolated // should be true
```

## Development

Install dependencies:

```bash
bun install
```

Start dev server:

```bash
bun run dev
```

Lint:

```bash
bun run lint
```

Build:

```bash
bun run build
```

Preview production build:

```bash
bun run preview
```

## Notes and limitations

- Initial runtime startup can take longer on first run (assets/runtime bootstrapping).
- Infinite loops can still lock the browser tab.
- Execution is local to the browser context; this is not a multi-user remote execution platform.
