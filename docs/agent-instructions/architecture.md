# Architecture and Runtime Map

## Core Runtime Architecture
- `Desktop` is a thin Tauri shell that starts the web server sidecar and loads the web UI from `http://127.0.0.1:<port>`.
- Feature backend logic lives in `packages/web/server/*` and, for VS Code runtime behavior, `packages/vscode/*`.
- `packages/desktop/src-tauri/src/main.rs` is for native integrations (menu, dialogs, notifications, updater, deep-links), not feature backend logic.

## Tech Stack
- Runtime/tooling: Bun, Node >=20
- UI: React, TypeScript, Vite, Tailwind v4
- State: Zustand (`packages/ui/src/stores/`)
- UI primitives: Radix UI, HeroUI, Remixicon
- Server: Express (`packages/web/server/index.js`)
- Desktop: Tauri v2 (`packages/desktop/src-tauri/`)
- VS Code: extension + webview (`packages/vscode/`)

## Monorepo Layout
- Workspaces: `packages/*`
- Shared UI: `packages/ui`
- Web app + server + CLI: `packages/web`
- Desktop app: `packages/desktop`
- VS Code extension: `packages/vscode`

## Runtime Entry Points
- Web bootstrap: `packages/web/src/main.tsx`
- Web server: `packages/web/server/index.js`
- Web CLI: `packages/web/bin/cli.js`
- Desktop runtime entry: `packages/desktop/src-tauri/src/main.rs`
- VS Code extension host: `packages/vscode/src/extension.ts`
- VS Code webview bootstrap: `packages/vscode/webview/main.tsx`

## OpenCode Integration
- UI SDK wrapper: `packages/ui/src/lib/kronoscode/client.ts` (imports `@opencode-ai/sdk/v2`)
- SSE hookup: `packages/ui/src/hooks/useEventStream.ts`
- OpenCode server creation/start: `packages/web/server/index.js` (`createOpencodeServer`)
- Filesystem endpoints: search `/api/fs/` in `packages/web/server/index.js`
- External server mode: set `OPENCHAMBER_PORT` and `OPENCHAMBER_SKIP_START=true`

## Key UI and Integration Touchpoints
- Settings shell: `packages/ui/src/components/views/SettingsView.tsx`
- Settings primitives: `packages/ui/src/components/sections/shared/`
- Chat UI: `packages/ui/src/components/chat/` and `packages/ui/src/components/chat/message/`
- Theme/typography: `packages/ui/src/lib/theme/`, `packages/ui/src/lib/typography.ts`
- Terminal UI: `packages/ui/src/components/terminal/` (`ghostty-web`)
- Git integration: `packages/ui/src/lib/gitApi.ts`, `packages/web/server/index.js` (`simple-git`)
- Terminal PTY: `packages/web/server/index.js` (`bun-pty`/`node-pty`)
- Skills catalog: `packages/web/server/lib/skills-catalog/` and `packages/ui/src/components/sections/skills/`
