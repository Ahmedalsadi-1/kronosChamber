# KronosChamber Runtime Reliability Plan (REVISED)

## TL;DR
> **Summary**: Implement runtime reliability improvements, browser UX cleanup, and new selection bubble feature in KronosChamber.
> **Deliverables**: Remove snapshot panel, add browser mode toggle in Header, implement Zen tabs, implement selection bubble, verify/improve SSE handling.
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: Phase 1 → Phase 4 → Phase 5

## Context

### Original Request
Implement desktop-first reliability work plus targeted runtime/SDK changes in KronosChamber:
1. Stronger backend/event-stream disconnect recovery
2. Unified runtime API contract (Browser + OpenBrowser + E2B first-class)
3. Browser tri-mode visibility: split, browser-only, chat-only
4. Browser UI cleanup: remove Snapshot panel
5. Zen-style multi-tab browser UX (top strip with pinned tabs)
6. In-browser AI entry via selection bubble actions
7. Keep backward compatibility with existing openchamber:* events

### Actual Baseline (Verified)
| Feature | Status | Evidence |
|---------|--------|----------|
| Tri-mode layout store | ✅ DONE | `useUIStore.ts:12` - `BrowserChatLayoutMode` |
| Tri-mode MainLayout | ✅ DONE | `MainLayout.tsx:628,633` - layoutMode rendering |
| /api/runtime/* endpoints | ✅ DONE | `index.js:7648-7969` |
| runtimeSdk.ts | ✅ DONE | `packages/ui/src/lib/runtimeSdk.ts` |
| Desktop browser commands | ✅ DONE | `main.rs` - 18 desktop_browser_* commands |
| SSE endpoint | ✅ DONE | `/api/global/event` + `/api/event` (line 7305) |
| useEventStream reconnection | ✅ DONE | `useEventStream.ts:302,317,1784,1815,2061` |

### What Actually Needs Work
1. **Phase 1**: Add richer SSE status hints, verify consolidation
2. **Phase 3**: Add browser mode toggle in Header (store+layout done, UI control missing)
3. **Phase 4**: Remove snapshot panel (BrowserView.tsx:638-668)
4. **Phase 4**: Implement Zen tabs (new BrowserTabStrip component)
5. **Phase 5**: Implement selection bubble (new feature)

## Work Objectives

### Core Objective
Complete browser UX improvements and reliability hardening while maintaining backward compatibility.

### Deliverables
- [ ] Browser mode toggle in Header
- [ ] Removed snapshot panel from BrowserView
- [ ] Zen-style tab strip component
- [ ] Selection bubble for in-browser AI interaction
- [ ] Enhanced SSE status indicators (if needed)

### Definition of Done
- All features work without breaking existing functionality
- `bun run type-check` passes
- `bun run lint` passes
- `bun run build` passes

## Verification Strategy
- Test decision: tests-after (minimal test infrastructure)
- QA policy: Every task has agent-executed scenarios
- Evidence: .sisyphus/evidence/task-{N}-{slug}.{ext}

## Execution Strategy

### Wave 1: Header + Snapshot Removal
- [ ] 1. Add browser mode toggle to Header.tsx
- [ ] 2. Remove snapshot panel from BrowserView.tsx (lines 638-668)

### Wave 2: Zen Tabs
- [ ] 3. Create BrowserTabStrip component
- [ ] 4. Create BrowserTabChip component
- [ ] 5. Integrate tab strip into BrowserView replacing page dropdown

### Wave 3: Selection Bubble
- [ ] 6. Add desktop_browser_selection_state command to main.rs
- [ ] 7. Create BrowserSelectionBubble component
- [ ] 8. Integrate bubble into BrowserView

### Final Verification
- [ ] F1. Run type-check
- [ ] F2. Run lint
- [ ] F3. Run build
- [ ] F4. Manual verification of all features

## TODOs

### Wave 1: Header + Snapshot Removal

- [ ] 1. Add browser mode toggle to Header

  **What to do**: Add browserChatLayoutMode toggle control to Header.tsx in the browser tab context. Use existing store methods: `toggleBrowserChatLayoutMode()` and `resolveBrowserChatLayoutMode()`.

  **Must NOT do**: Don't add duplicate state - use store methods.

  **References**:
  - Store: `packages/ui/src/stores/useUIStore.ts` - `toggleBrowserChatLayoutMode`, `resolveBrowserChatLayoutMode`
  - Header: `packages/ui/src/components/layout/Header.tsx`
  - Theme: Use theme-system skill for styling

  **Acceptance Criteria**:
  - [ ] Toggle button visible in Header when browser tab active
  - [ ] Clicking cycles through split → browser-only → chat-only → split

- [ ] 2. Remove snapshot panel from BrowserView

  **What to do**: Remove the snapshot panel section from BrowserView.tsx (lines 636-668). Keep the snapshot action API for backend compatibility but remove the UI.

  **Must NOT do**: Don't remove snapshot action API - only UI panel.

  **References**:
  - File: `packages/ui/src/components/views/BrowserView.tsx` lines 636-668
  - Keep: `handleUseSnapshot` callback if used elsewhere, snapshot action API

  **Acceptance Criteria**:
  - [ ] BrowserView no longer shows "Latest Snapshot" section
  - [ ] Snapshot functionality still works via API (if used elsewhere)

### Wave 2: Zen Tabs

- [ ] 3. Create BrowserTabStrip component

  **What to do**: Create new component `packages/ui/src/components/browser/BrowserTabStrip.tsx` with:
  - Horizontal scrollable tab strip
  - Active tab highlight
  - Close button per tab
  - New tab button
  - Pinned tab support
  - Overflow handling

  **Must NOT do**: Don't reimplement existing tab logic - wrap existing desktop_browser_* commands.

  **References**:
  - BrowserView: `packages/ui/src/components/views/BrowserView.tsx`
  - Desktop commands: `packages/desktop/src-tauri/src/main.rs` - desktop_browser_* 
  - Theme: Use theme-system skill

  **Acceptance Criteria**:
  - [ ] TabStrip renders horizontal list of tabs
  - [ ] Can switch between tabs
  - [ ] Can close tabs (prevents closing last tab)
  - [ ] Can add new tab
  - [ ] Active tab visually highlighted

- [ ] 4. Create BrowserTabChip component

  **What to do**: Create tab chip subcomponent for individual tab rendering.

  **References**:
  - Parent: BrowserTabStrip.tsx

  **Acceptance Criteria**:
  - [ ] Chip shows tab title (truncated if long)
  - [ ] Close button visible on hover
  - [ ] Active state styling

- [ ] 5. Integrate tab strip into BrowserView

  **What to do**: Replace page `<select>` dropdown with BrowserTabStrip in BrowserView.tsx.

  **References**:
  - BrowserView: Find where page selector is rendered
  - TabStrip: packages/ui/src/components/browser/BrowserTabStrip.tsx

  **Acceptance Criteria**:
  - [ ] Page dropdown replaced with tab strip
  - [ ] Tab operations (new, close, select) work correctly

### Wave 3: Selection Bubble

- [ ] 6. Add desktop_browser_selection_state command

  **What to do**: Add new Tauri command in main.rs that:
  - Evaluates JavaScript in active webview to get current selection
  - Returns structured payload: { text, bounds?, timestamp, pageUrl, pageTitle }

  **Must NOT do**: Don't break existing desktop browser commands.

  **References**:
  - File: `packages/desktop/src-tauri/src/main.rs`
  - Existing pattern: Other desktop_browser_* commands

  **Acceptance Criteria**:
  - [ ] Command returns selection text from active page
  - [ ] Command returns page URL and title

- [ ] 7. Create BrowserSelectionBubble component

  **What to do**: Create new component `packages/ui/src/components/browser/BrowserSelectionBubble.tsx` with:
  - Shows when non-empty selection exists
  - Bubble actions: "Ask KronosCoder", "Run OpenBrowser Task", "Run E2B Task"
  - Auto-open chat for "Ask" flow if layout is browser-only

  **References**:
  - Desktop command: desktop_browser_selection_state
  - Theme: Use theme-system skill

  **Acceptance Criteria**:
  - [ ] Bubble appears when text selected in browser
  - [ ] All three action buttons work

- [ ] 8. Integrate bubble into BrowserView

  **What to do**: Add BrowserSelectionBubble to BrowserView, wire to desktop command for selection state.

  **References**:
  - BrowserView: packages/ui/src/components/views/BrowserView.tsx
  - Bubble: packages/ui/src/components/browser/BrowserSelectionBubble.tsx

  **Acceptance Criteria**:
  - [ ] Bubble appears over selected text
  - [ ] Actions trigger correct flows

### Final Verification Wave

- [ ] F1. Run type-check

  **Acceptance Criteria**:
  - [ ] `bun run type-check` passes with no errors

- [ ] F2. Run lint

  **Acceptance Criteria**:
  - [ ] `bun run lint` passes with no errors

- [ ] F3. Run build

  **Acceptance Criteria**:
  - [ ] `bun run build` completes successfully

- [ ] F4. Manual verification

  **Acceptance Criteria**:
  - [ ] Browser mode toggle works
  - [ ] Snapshot panel removed
  - [ ] Tab strip functional
  - [ ] Selection bubble functional

## Commit Strategy
- Feature-based commits for each wave
- Keep hello-halo untouched (NOT in this repo)

## Success Criteria
- All acceptance criteria met
- Build passes
- No regressions
