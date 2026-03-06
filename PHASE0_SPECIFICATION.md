# Phase 0: Specification and Scope Guardrails (2026-02-28)

## Overview
This document locks the scope and implementation requirements for the **KronosChamber Runtime Reliability + Agent SDK Embedding Plan** across six phases.

## Specification Updates
- Primary: `docs/browser-parity-spec.md` - UPDATED with tri-mode, Zen tabs, selection bubble, reliability
- Primary: `docs/desktop-agent-runtime-spec.md` - UPDATED with unified API, stream reliability, rollback toggles
- Baseline: `docs/CUSTOM_THEMES.md`, `docs/references/badges/` - unchanged

## Scope Guardrails

### What We Lock
1. **Snapshot panel UI removal** - BrowserView.tsx lines 668-696 removed; backend action retained for compatibility
2. **Tri-mode layout** - Split/browser-only/chat-only with per-project persistence
3. **Zen tab strip** - Replaces page `<select>` with horizontal scrollable chips
4. **Selection bubble** - In-browser AI entry via text selection
5. **Progressive recovery ladder** - SSE reconnect → interconnect refresh → bootstrap resync
6. **Unified runtime API** - Canonical `/api/runtime/*` endpoints + experimental KronosCoder embedding

### What We Keep
1. **Backward compatibility** - Old endpoints aliased; `openchamber:*` events unchanged
2. **Hello-halo untouched** - Reference app remains source of truth only
3. **Snapshot backend action** - Still callable via API; only UI panel removed
4. **Desktop-centric** - Desktop remains primary runtime; web/VS Code remain secondary

### What We Accept
1. **Browser operations require Desktop app** - Selection bubble, Zen tabs, desktop-only features
2. **Progressive degradation** - Chat works without browser; Browser works independently
3. **Feature gating** - Tri-mode defaults to split; selection bubble requires desktop shell

## Task Lifecycle Specification

### New Stream Payloads
```ts
type StreamLifecycleEvent = {
  type: "openchamber:stream-lifecycle";
  properties: {
    action: "connect" | "close" | "error";
    reason: "client-disconnect" | "upstream-finished" | "idle-timeout" | "connect-timeout" | "upstream-error" | "client-refresh";
    duration?: number;
    errorMessage?: string;
    timestamp: number;
  };
};
```

### New RichEventStreamStatus Type
```ts
type EventStreamStatus =
  | "idle"           // no subscription attempted
  | "connecting"     // attempting SSE handshake
  | "connected"      // active stream
  | "reconnecting"   // automatic reconnect in progress
  | "degraded"       // relay healthy but events sparse/delayed
  | "offline"        // no connectivity
  | "paused"         // user-paused or debug mode
  | "error";         // unrecoverable error
```

### New Tri-Mode Type
```ts
type BrowserChatLayoutMode = "split" | "browser-only" | "chat-only";
```

### Selection Bubble Bridge Contract
```ts
// Tauri command response
type BrowserSelectionState = {
  text: string;        // trimmed selected text
  url: string;         // current page URL
  title: string;       // current page title
  timestamp: number;   // when selection was captured
};
```

## Implementation Checkpoints

| Phase | Files Modified | Key Decisions | Estimated LOC |
| --- | --- | --- | --- |
| Phase 0 | `docs/browser-parity-spec.md`, `docs/desktop-agent-runtime-spec.md`, `AGENTS.md` update | Lock scope, update docs | 300 |
| Phase 1 | `packages/web/server/index.js`, `packages/ui/src/hooks/useEventStream.ts`, desktop Tauri | Unify SSE, add failover, relay robustness | 800 |
| Phase 2 | `packages/web/server/index.js`, `packages/ui/src/lib/runtimeSdk.ts`, KronosCoder experimental | Unified API contract, SDK types | 600 |
| Phase 3 | `packages/ui/src/stores/useUIStore.ts`, `packages/ui/src/components/layout/MainLayout.tsx`, Header | Tri-mode rendering, toggles, persistence | 500 |
| Phase 4 | `packages/ui/src/components/views/BrowserView.tsx`, new `BrowserTabStrip.tsx` | Remove snapshot, implement Zen tabs | 700 |
| Phase 5 | `packages/desktop/src-tauri/src/main.rs`, `packages/ui/src/components/browser/BrowserSelectionBubble.tsx` | Selection bridge, bubble UI, actions | 600 |
| Phase 6 | Full integration + E2E testing | Consistency sweep, rollback gates | 300 |
| **Total** | 6+ files across 4 packages | Reliability + UX polish | ~4,200 |

## Acceptance Matrix

### Snapshot Removal
- [ ] Heading "Latest Snapshot" removed from BrowserView
- [ ] "Refresh snapshot" button removed
- [ ] "Use latest snapshot" button removed
- [ ] Snapshot textarea removed
- [ ] Backend `/api/browser/snapshot` endpoint remains callable (compatibility)

### Tri-Mode Layout
- [ ] `BrowserChatLayoutMode` enum in useUIStore
- [ ] Per-project override map keyed by directory
- [ ] MainLayout renders split/browser-only/chat-only based on mode
- [ ] RuntimeStrip visible in all modes (desktop)
- [ ] Header toggle cycles modes with visual indicator
- [ ] Mode persists on project switch

### Zen Tab Strip
- [ ] Page `<select>` dropdown replaced with horizontal top strip
- [ ] Tab chips show title/URL truncated
- [ ] Active tab has visual highlight
- [ ] Close button on each chip (except last page)
- [ ] New tab button at strip end
- [ ] Pinned tabs stay fixed on left
- [ ] Scroll arrows appear on overflow

### Selection Bubble
- [ ] `desktop_browser_selection_state` Tauri command returns current selection
- [ ] Bubble appears when >0 chars selected in live browser
- [ ] Bubble positioned near selection
- [ ] Three actions: Ask / Run OpenBrowser / Run E2B
- [ ] Ask imports selection into chat, opens chat if hidden
- [ ] Run actions execute with selection as context

### Stream Reliability
- [ ] `/api/global/event` is canonical SSE path (scope=global)
- [ ] `/api/event` remains alias (No-op migration)
- [ ] Stream lifecycle events logged: connect/close/error with reason
- [ ] Client reconnect ladder: SSE → interconnect refresh → bootstrap resync
- [ ] Failover deduplication by `eventId|type|sessionId`
- [ ] `EventStreamStatus` includes `connecting`, `reconnecting`, `degraded`, `offline`
- [ ] Desktop relay logs consecutive transient errors + maintains `lastEventAt`

### Unified Runtime API
- [ ] `GET /api/runtime/status` - returns global status
- [ ] `POST /api/runtime/task` - creates task
- [ ] `GET /api/runtime/tasks?sessionID=...&mode=...` - lists tasks
- [ ] `GET /api/runtime/task/:taskID` - gets single task
- [ ] `POST /api/runtime/browser/action` - browser action
- [ ] `GET /api/runtime/browser/state` - browser state
- [ ] Old `/api/agent-mode/*` endpoints remain as compatibility aliases
- [ ] Task model standardized: `queued → running → done` lifecycle

### SDK Embedding in KronosCoder
- [ ] `/experimental/runtime/*` routes in OpenCode (experimental)
- [ ] Maps to KronosChamber `/api/runtime/*` upstream
- [ ] Agent logic uses unified contract
- [ ] `/experimental/browser/*` routes untouched (compatibility)

### Baseline Validation
- [ ] `bun run type-check` passes
- [ ] `bun run lint` passes
- [ ] `bun run build` succeeds
- [ ] `cargo check --manifest-path packages/desktop/src-tauri/Cargo.toml` succeeds
- [ ] In OpenCode repo: `bun run typecheck` and `bun run --cwd packages/opencode build` succeed

## Rollback Toggles

If a phase causes regression, enable the corresponding toggle:
- **Phase 1**: `SSE_UNIFIED_FORWARDER=false` - revert to original `/api/event`
- **Phase 3**: `LAYOUT_MODE_FORCE=split` - force split mode
- **Phase 4**: `SNAPSHOT_PANEL_VISIBLE=true` - show snapshot UI
- **Phase 5**: `SELECTION_BUBBLE_DISABLED=true` - hide selection bubble

## Success Criteria

### Immediate (EOD 2026-02-28)
- [ ] Phase 0 specs finalized and documented
- [ ] Acceptance matrix populated
- [ ] All files listed for modification

### Short-term (Phase 1-2)
- [ ] SSE unified + client failover operational
- [ ] Unified runtime API passing contract tests
- [ ] KronosCoder experimental embedding verified

### Medium-term (Phase 3-4)
- [ ] Tri-mode layout toggle working
- [ ] Zen tab strip fully functional
- [ ] Snapshot panel removed

### Long-term (Phase 5-6)
- [ ] Selection bubble functional in desktop app
- [ ] E2E test suite covering all phases
- [ ] Rollback toggles verified

## Known Constraints

1. **Selection bubble requires desktop app** - Not available in web or VS Code runtimes
2. **Zen tabs require managed browser** - OpenCode/desktop-browser only
3. **SSE unified forwarder must preserve event order** - No reordering during migration
4. **Per-project layout mode persists only after directory load** - Until next save
5. **Tauri selection bridge requires webview DOM access** - Enforced by sandboxing

## Next Steps

1. ✅ Phase 0 complete: specs locked, matrices defined
2. → Phase 1: Backend disconnect hardening
3. → Phase 2: Unified runtime API + SDK
4. → Phase 3: Tri-mode layout + header
5. → Phase 4: Snapshot removal + Zen tabs
6. → Phase 5: Selection bubble
7. → Phase 6: E2E validation + rollback gates

---

**Status**: 🔒 LOCKED (2026-02-28 14:00 UTC)  
**Decision Authority**: Technical Steering  
**Rollback Owner**: On-call Engineer  
**Last Updated**: 2026-02-28
