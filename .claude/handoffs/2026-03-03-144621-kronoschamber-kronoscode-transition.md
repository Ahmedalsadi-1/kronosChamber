# Handoff: KronosChamber UI Sleeve Stabilization + KronosCode Integration Plan

## Session Metadata
- Created: 2026-03-03 14:46:21
- Updated: 2026-03-03 15:08:00
- Project: /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber
- Branch: main
- Session duration: ~2.5 hours across implementation + validation + architecture handoff

## Recent Commits (for context)
- 93042ef feat(settings): group agents and skills sidebar by subfolder (#464)
- 1d1bdb7 perf: fix streaming lag, memory leaks, stuck spinners, and proxy timeout (#483)
- 5a9e7d6 feat(files): add 'Reveal in Finder' to file tree context menus (#482)
- 06299c8 refactor(notifications): move notification helpers into dedicated module boundary (#484)
- ef0e510 feat(chat): per-session draft persistence + expandable input focus mode (#480)

## Handoff Chain
- **Continues from**: None (fresh start)
- **Supersedes**: None

## Current State Summary
KronosChamber is functioning as a desktop/web UI sleeve over KronosCode/OpenCode-style backend APIs. Critical reliability work for browser/webview module loading was completed and validated: browser bundles no longer contain `node:*` imports, and build gates are wired to fail on regression. Desktop build now reaches full app/dmg bundling and fails only at signing when `TAURI_SIGNING_PRIVATE_KEY` is missing. Runtime/browser mode work was implemented to support `desktop-browser` as a first-class mode with split layout and native desktop browser control UX, including fallback messaging. The biggest remaining integration gap is naming/contract consistency for external-server mode: docs/CLI mention `KRONOSCODE_*` env vars, but web runtime attach/start logic still keys on `OPENCODE_*`/`OPENCHAMBER_*`.

## Codebase Understanding

## Architecture Overview
- `packages/ui` is the shared React UI used by web, desktop, and VS Code runtimes.
- `packages/web/server/index.js` is the runtime API layer and backend proxy/manager.
- Desktop (`packages/desktop/src-tauri`) is a thin Tauri shell that launches sidecar web server and webview; backend logic is not in Rust.
- VS Code has independent manager logic in `packages/vscode/src/opencode.ts` and webview bootstrap in `packages/vscode/webview`.
- UI SDK wrapper points to `/api` by default and desktop local origin in desktop mode.

## Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/web/server/index.js | API gateway, settings sanitization, runtime routes, backend attach/spawn logic | Primary integration and external-only behavior control |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/ui/src/components/chat/ChatInput.tsx | Agent mode parsing + slash command UX | `desktop-browser` user flow and mode persistence |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/ui/src/components/layout/MainLayout.tsx | Tab/layout control | Forces browser split layout during active desktop-browser workflows |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/ui/src/components/chat/runtime/RuntimeStrip.tsx | Runtime status strip | Live browser control lock + reset action quick wins |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/ui/src/lib/desktop-control.ts | Desktop-control MCP presets | `remote-macos-use` preset, env fields, default user scope |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/ui/src/components/sections/desktop-control/DesktopControlSettings.tsx | Desktop-control settings UI | Real MCP config install/connect/remove + diagnostics |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/scripts/verify-browser-node-imports.mjs | Browser bundle safety gate | Prevents `node:*` regressions in web/webview/desktop assets |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/web/vite.config.ts | Web bundling alias control | Forces browser-safe SDK entrypoints |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/vscode/vite.config.ts | VS Code webview bundling alias control | Forces browser-safe SDK entrypoints |
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/ui/src/components/ui/OpenChamberLogo.tsx | Brand rendering | New Kronos branding assets and animation usage |

## Key Patterns Discovered
- Runtime separation pattern: UI always talks to local sleeve `/api`; sleeve proxies to backend.
- Desktop mode requires strict no-Node-builtins in browser bundles, enforced via script gate.
- `desktop-browser` should remain out of background task runner path; it is a native connector mode.
- Existing config compatibility depends on preserving `openchamber:*` event keys and `~/.config/openchamber` paths for now.

## Work Completed

## Tasks Finished
- [x] Re-validated build reliability gates after implementation:
  - `bun run build:web` passed
  - `bun run vscode:build` passed
  - `bun run verify:browser-node-imports` passed (`no node:* imports`)
  - `bun run desktop:build` produced app/dmg and failed only at signing key step
- [x] Confirmed runtime route cleanup and canonical runtime browser endpoints in server.
- [x] Confirmed `desktop-browser` mode integration across parsing, persistence, and split layout behavior.
- [x] Confirmed desktop-control MCP integration path with real config operations and `remote-macos-use` preset.
- [x] Confirmed branding assets copied and wired to user-visible surfaces.
- [x] Produced architecture + operation handoff explaining how sleeve connects to KronosCode.

## Files Modified (latest cycle focus)

| File | Changes | Rationale |
|------|---------|-----------|
| /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/.claude/handoffs/2026-03-03-144621-kronoschamber-kronoscode-transition.md | Replaced scaffold placeholders with complete technical handoff | Preserve full resume context for next agent/session |

## Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Keep current compatibility keys/paths (`openchamber:*`, `~/.config/openchamber`) | Full internal rename now vs phased migration | Avoid breaking existing installs/configs during UI sleeve stabilization |
| Treat desktop build signing failure as non-runtime blocker | Block rollout vs separate signing concern | Runtime/module-load reliability is validated; signing is release pipeline config |
| Prioritize external-server contract clarity next | Continue adding UI features first | Core goal is “KronosCode-first sleeve”; env/attach contract must be unambiguous |

## Pending Work

## Immediate Next Steps
1. Implement env alias normalization in web server startup logic:
   - Accept `KRONOSCODE_PORT` and map to current OpenCode port handling.
   - Accept `KRONOSCODE_SKIP_START` and map to current skip-start handling.
2. Add strict external-only mode switch (`KRONOSCODE_EXTERNAL_ONLY=true` or equivalent):
   - If enabled, never spawn managed backend.
   - Fail fast with explicit error if external backend health check fails.
3. Update docs and CLI help so env names are internally consistent and tested end-to-end (Web + Desktop + VS Code).
4. Add automated regression tests (or script checks) for env contract:
   - External-only set + backend down => deterministic failure.
   - External-only set + backend up => no spawn path used.
5. Optional but recommended: add server log line at startup explicitly stating mode: `managed` or `external-only`.

## Blockers/Open Questions
- [ ] Should external-only be hard-required for all production runs, or per-runtime configurable?
- [ ] Confirm canonical env namespace for long-term (`KRONOSCODE_*` only vs dual support for backward compatibility).
- [ ] Decide migration plan for existing `OPENCODE_*` users (deprecation warnings vs silent alias forever).

## Deferred Items
- Full internal identifier migration from `openchamber` to `kronos*` (deferred to avoid compatibility break).
- Cross-runtime diagnostic export bundle (desktop/web/vscode) as a packaged support artifact.

## Context for Resuming Agent

## Important Context
- Reliability fixes are in place and passing gates; desktop runtime no longer fails due to browser `node:*` imports.
- Desktop build output proves app packaging path is healthy; only signing key is missing.
- The most important correctness gap is env contract mismatch: docs/CLI mention `KRONOSCODE_*`, while web server runtime still keys off `OPENCODE_*`/`OPENCHAMBER_*`. This can mislead users trying to attach to external KronosCode server.
- Keep changes tight and compatibility-safe: do not mass-rename internal event keys or config directories in this phase.

## Assumptions Made
- User wants KronosChamber to operate primarily as UI sleeve to external KronosCode backend.
- No new dependencies should be added.
- Existing dirty worktree is intentional and must not be reverted.

## Potential Gotchas
- `/Users/albsheralsadi/kronosfinal/kronosChamber` resolves to `/Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber`.
- Desktop native browser mode (`desktop-browser`) must not be sent through background runner endpoints.
- README examples currently imply `KRONOSCODE_*` works directly for web runtime; verify implementation before claiming done.
- Desktop release build still needs `TAURI_SIGNING_PRIVATE_KEY` to complete signing step.

## Environment State

## Tools/Services Used
- Bun scripts for build/verify (`build:web`, `vscode:build`, `desktop:build`, `verify:browser-node-imports`)
- Tauri desktop packaging path
- MCP config inspection from `~/.codex/config.toml`
- Session handoff skill scripts

## Active Processes
- No long-running process intentionally left active by this handoff.

## Environment Variables
- `OPENCODE_PORT`
- `OPENCHAMBER_OPENCODE_PORT`
- `OPENCODE_SKIP_START`
- `OPENCHAMBER_SKIP_OPENCODE_START`
- `OPENCODE_SERVER_PASSWORD`
- `TAURI_SIGNING_PRIVATE_KEY`
- `KRONOSCODE_PORT` (documented target alias; not yet normalized in runtime)
- `KRONOSCODE_SKIP_START` (documented target alias; not yet normalized in runtime)

## Related Resources
- /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/web/server/index.js
- /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/ui/src/lib/opencode/client.ts
- /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/desktop/src-tauri/src/main.rs
- /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/scripts/verify-browser-node-imports.mjs
- /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/README.md
- /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber/packages/web/README.md

---

**Security Reminder**: Validate handoff before finalization and avoid storing secret values.
