# KronosChamber 2026-02-28 Release Plan: Runtime Reliability + Agent SDK

## 🎯 Objective
Implement a desktop-first, reliability-focused release combining stronger backend/event-stream recovery, unified runtime API contract, and browser/agent interaction polish.

## 📋 Deliverables (Decision-Final)

### Phase 0: ✅ Specification & Scope Guardrails (COMPLETE)
**Output**: Three documentation files locking scope and acceptance matrix
- [PHASE0_SPECIFICATION.md](./PHASE0_SPECIFICATION.md) - Decision lock, scope guardrails, acceptance matrix
- [PHASE0_COMPLETION_REPORT.md](./PHASE0_COMPLETION_REPORT.md) - Implementation roadmap + patterns
- [browser-parity-spec.md](./docs/browser-parity-spec.md) - Updated with reliability, tri-mode, Zen tabs, selection
- [desktop-agent-runtime-spec.md](./docs/desktop-agent-runtime-spec.md) - Extended with unified API, stream recovery, rollback toggles

**Status**: 🔒 LOCKED | Reading time: 10 min | Scope: 4,200 LOC across 6+ files

---

### Phase 1: Backend Disconnect Hardening (Progressive Recovery)
**Objective**: Harden SSE forwarding, add client-side failover ladder, improve relay robustness  
**Owner**: Implement stream pipeline  
**Impact**: ⭐⭐⭐⭐⭐ (Core reliability)

**Files**:
- `packages/web/server/index.js` (7305+) - Consolidate SSE routes, lifecycle logging
- `packages/ui/src/hooks/useEventStream.ts` - Failover ladder, dedup logic
- `packages/desktop/src-tauri/src/main.rs` - Relay robustness, transient error handling

**Key Decisions**:
- Canonical path: `/api/global/event` (scope=global)
- Failover: SSE reconnect → interconnect.forceReconnect() → bootstrap resync
- Dedup key: `${eventId}|${type}|${sessionId}`
- Status hints: `connecting`, `reconnecting`, `degraded`, `offline` + reason text

**Deliverables**:
- ✅ Unified SSE forwarder (no event loss on reconnect)
- ✅ Client failover ladder (3-step recovery)
- ✅ Stream lifecycle logging (connect/close/error with reason)
- ✅ Event deduplication (prevent duplicates on relay recovery)

**Validation**: `bun run type-check && bun run lint && bun run build`

---

### Phase 2: Unified Runtime API + Agent SDK Embedding
**Objective**: Normalize runtime endpoints (E2B, OpenBrowser, Desktop); embed in KronosCoder  
**Owner**: Implement unified contract  
**Impact**: ⭐⭐⭐⭐ (SDK alignment, agent consistency)

**Files**:
- `packages/web/server/index.js` - Canonical `/api/runtime/*` endpoints
- `packages/ui/src/lib/runtimeSdk.ts` - New unified types
- `packages/ui/src/stores/useAgentRuntimeStore.ts` - Use unified SDK
- KronosCoder `packages/opencode/src/server/routes/experimental.ts` - `/experimental/runtime/*` proxy

**Key Decisions**:
- Canonical endpoints: status, task, tasks, task/:id, browser/action, browser/state
- Task model: queued → running → done (standardized)
- Compatibility: `/api/agent-mode/*` aliased to new endpoints
- SDK embedding: OpenCode experimental routes map to KronosChamber upstream

**Deliverables**:
- ✅ Unified runtime API (all modes use same contract)
- ✅ Runtime SDK types (TypeScript runtime types)
- ✅ Backward compat (old endpoints still work)
- ✅ Agent-ready SDK (KronosCoder can use unified contract)

**Validation**: `bun run type-check && bun run lint && bun run build`

---

### Phase 3: Browser/Chat Tri-Mode Layout
**Objective**: Split/browser-only/chat-only modes with per-project persistence  
**Owner**: Implement layout modes  
**Impact**: ⭐⭐⭐ (UX polish, flexibility)

**Files**:
- `packages/ui/src/stores/useUIStore.ts` - Store model (enum already exists!)
- `packages/ui/src/components/layout/MainLayout.tsx` - Tri-mode rendering
- `packages/ui/src/components/layout/Header.tsx` - Mode toggle + shortcut

**Key Decisions**:
- Default: split (browser right, chat left)
- Storage: global + per-project (keyed by directory)
- Toggle: visible in header during browser tab (desktop only)
- Widget: RuntimeStrip/FloatingRuntimeWidget visible in all modes

**Deliverables**:
- ✅ Split mode (baseline: browser right + chat left)
- ✅ Browser-only mode (fullscreen; chat hidden but active)
- ✅ Chat-only mode (fullscreen; browser hidden but active)
- ✅ Mode persists (global + per-project)
- ✅ Toggle control (header button + shortcut hint)

**Validation**: `bun run type-check && bun run lint && bun run build`

---

### Phase 4: Browser UX Cleanup + Zen Tabs
**Objective**: Remove snapshot panel; implement Zen-style tab strip  
**Owner**: Implement browser UX  
**Impact**: ⭐⭐⭐ (UX polish, simplification)

**Files**:
- `packages/ui/src/components/views/BrowserView.tsx` - Remove snapshot section (lines 668-696)
- `packages/ui/src/components/browser/BrowserTabStrip.tsx` - New Zen tab strip
- `packages/ui/src/components/browser/BrowserTabChip.tsx` - Tab chip component

**Key Decisions**:
- Snapshot removal: UI gone; backend API retained (compatibility)
- Zen tabs: horizontal scrollable strip replaces `<select>` dropdown
- Pin support: pinned tabs stay on left; persist pin state
- Overflow: scroll arrows visible when needed; auto-scroll active tab into view

**Deliverables**:
- ✅ Snapshot removal (clean browser UI)
- ✅ Zen tab strip (title/URL, active highlight, close, new-tab)
- ✅ Tab pinning (persistent pin state)
- ✅ Overflow handling (scroll arrows, auto-scroll)

**Validation**: `bun run type-check && bun run lint && bun run build`

---

### Phase 5: In-Browser AI Interaction (Selection Bubble)
**Objective**: Select text in live browser; trigger AI actions  
**Owner**: Implement selection bridge + UI  
**Impact**: ⭐⭐⭐⭐ (Agent interaction polish)

**Files**:
- `packages/desktop/src-tauri/src/main.rs` - New `desktop_browser_selection_state` command
- `packages/ui/src/components/views/BrowserView.tsx` - Selection polling integration
- `packages/ui/src/components/browser/BrowserSelectionBubble.tsx` - New bubble UI

**Key Decisions**:
- Command: `desktop_browser_selection_state()` → `{ text, url, title, timestamp }`
- Bubble: appears when >0 chars selected; positioned near selection
- Actions: Ask KronosCoder (prefill + open chat), Run OpenBrowser, Run E2B
- Auto-open: "Ask" action auto-opens chat if in browser-only mode

**Deliverables**:
- ✅ Tauri selection bridge (command returns current selection + metadata)
- ✅ Selection bubble UI (positioned, non-obstructing)
- ✅ Three action flows (Ask, Run OpenBrowser, Run E2B)
- ✅ Auto-popup for chat (browser-only mode)

**Validation**: `bun run type-check && bun run lint && cargo check --manifest-path packages/desktop/src-tauri/Cargo.toml && bun run build`

---

### Phase 6: Runtime Surface Consistency + E2E Validation
**Objective**: Ensure all surfaces reflect unified state; comprehensive testing  
**Owner**: Integration + QA  
**Impact**: ⭐⭐⭐⭐⭐ (Stability, confidence)

**Activities**:
- [ ] Verify runtime card/strip/widget all show canonical task state
- [ ] Test all failover scenarios (SSE drop, relay degraded, bootstrap resync)
- [ ] Test tri-mode persistence across project switch
- [ ] Test Zen tabs (add/close/pin/overflow)
- [ ] Test selection bubble (appear/actions/vanish)
- [ ] Test unified API contract (all modes work)
- [ ] Full validation: type-check, lint, build, cargo check
- [ ] OpenCode validation: typecheck + build in parallel
- [ ] Create rollback toggles (4 key toggles for each phase)

**Deliverables**:
- ✅ All phases green (type-check, lint, build pass)
- ✅ Regression gates (0 new crashes, all tests pass)
- ✅ Rollback toggles (4 toggles for Phase 1, 3, 4, 5)
- ✅ Integration verified (agent SDK works end-to-end)

---

## 🔒 Locked Scope

### What We Change
1. **Snapshot panel** - Remove UI (lines 668-696 BrowserView.tsx)
2. **Tri-mode layout** - Add split/browser-only/chat-only modes
3. **Zen tabs** - Replace `<select>` with horizontal chip strip
4. **Selection bubble** - Add in-browser AI entry point
5. **SSE hardening** - Unify forwarders, add failover ladder
6. **Unified API** - Normalize runtime endpoints across modes

### What We Keep
1. **Hello-halo** - Reference app untouched
2. **Backward compat** - Old endpoints aliased; events unchanged
3. **Snapshot backend** - API action still callable (only UI removed)
4. **Desktop-centric** - Desktop remains primary; web/VS Code stay secondary

### What We Accept
1. **Desktop-only features** - Selection bubble requires Tauri app
2. **Progressive degradation** - Chat works without browser; browser works independently
3. **Feature gating** - Tri-mode on desktop only; selection bubble desktop+managed browser only

---

## 📊 Estimate

| Phase | Estimated LOC | Complexity | Time (hours) |
| --- | --- | --- | --- |
| Phase 1 | 800 | High | 6-8 |
| Phase 2 | 600 | Medium | 4-5 |
| Phase 3 | 500 | Medium | 3-4 |
| Phase 4 | 700 | Medium | 4-5 |
| Phase 5 | 600 | High | 5-6 |
| Phase 6 | 300 | Low | 3-4 |
| **Total** | **~3,500** | **Medium** | **~25-32 hours** |

---

## ✅ Success Criteria

- [ ] Phase 1: SSE reconnect <5 sec, <1 event loss
- [ ] Phase 2: Unified API used by all runtime modes
- [ ] Phase 3: Tri-mode toggle working, layout persists
- [ ] Phase 4: Snapshot removed, Zen tabs responsive
- [ ] Phase 5: Selection bubble functional, actions work
- [ ] Phase 6: All tests green, 0 regressions
- [ ] Validation: `bun run build`, `cargo check`, type-check, lint all pass
- [ ] Agent integration: KronosCoder uses unified runtime SDK

---

## 🔄 Rollback Plan

If any phase breaks production, flip the corresponding toggle:
```bash
SSE_UNIFIED_FORWARDER=false          # Phase 1 revert
LAYOUT_MODE_FORCE=split              # Phase 3 revert
SNAPSHOT_PANEL_VISIBLE=true          # Phase 4 revert
SELECTION_BUBBLE_DISABLED=true       # Phase 5 revert
```

---

## 📖 Reference Docs

- **Specification**: [PHASE0_SPECIFICATION.md](./PHASE0_SPECIFICATION.md) - Comprehensive lock-down
- **Implementation**: [PHASE0_COMPLETION_REPORT.md](./PHASE0_COMPLETION_REPORT.md) - Roadmap + patterns
- **Browser Parity**: [docs/browser-parity-spec.md](./docs/browser-parity-spec.md) - Updated matrix
- **Runtime Spec**: [docs/desktop-agent-runtime-spec.md](./docs/desktop-agent-runtime-spec.md) - Extended contract

---

## 📌 Decision Authority

- **Architecture**: 🔒 Locked (2026-02-28)
- **Scope**: 🔒 Locked (2026-02-28)
- **Implementation**: Ready for Phase 1 start
- **Rollback**: On-call engineer can flip toggles anytime

---

**Status**: Phase 0 ✅ COMPLETE — Ready to begin Phase 1  
**Next**: Open Phase 1 implementation task (backend hardening)
