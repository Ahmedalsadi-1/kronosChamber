# Session Handoff: KronosChamber Runtime Reliability Plan

**Created**: 2026-03-01
**Project**: /Users/albsheralsadi/kronosfinal/kronoscoder/kronosChamber
**Branch**: main
**Commit**: 93042ef

---

## Current State Summary

The KronosChamber Runtime Reliability Plan has been created and analysis completed. The plan identifies which features are already implemented vs what needs to be built.

### Already Implemented (Verify Only)
- ✅ Tri-mode browser/chat layout (`BrowserChatLayoutMode` in useUIStore.ts)
- ✅ MainLayout rendering of tri-mode (MainLayout.tsx:628,633)
- ✅ Unified `/api/runtime/*` endpoints (index.js:7648-7969)
- ✅ runtimeSdk.ts library (packages/ui/src/lib/runtimeSdk.ts)
- ✅ Desktop browser commands (18 desktop_browser_* in main.rs)
- ✅ SSE event stream with reconnection logic (useEventStream.ts)

### What Needs Implementation
1. Browser mode toggle in Header.tsx (UI control missing)
2. Remove snapshot panel from BrowserView.tsx (lines 636-668)
3. Create BrowserTabStrip.tsx component (new)
4. Create BrowserTabChip.tsx component (new)
5. Integrate tab strip into BrowserView
6. Add desktop_browser_selection_state command to main.rs
7. Create BrowserSelectionBubble.tsx component
8. Integrate bubble into BrowserView

---

## Critical Context

### Key Files
- **Store**: `packages/ui/src/stores/useUIStore.ts` - Contains `toggleBrowserChatLayoutMode()` and `resolveBrowserChatLayoutMode()`
- **Header**: `packages/ui/src/components/layout/Header.tsx` - Needs toggle button added
- **BrowserView**: `packages/ui/src/components/views/BrowserView.tsx` - Snapshot panel at lines 636-668 to remove
- **Desktop main**: `packages/desktop/src-tauri/src/main.rs` - Add new desktop_browser_selection_state command
- **Theme**: Use theme-system skill for all UI styling (NEVER hardcoded colors)

### Constraints
- Keep hello-halo untouched (NOT in this repo)
- Maintain backward compatibility with existing `openchamber:*` events
- Keep `/api/agent-mode/*` routes as aliases
- All UI changes must use theme tokens, not hardcoded colors

### Tech Stack
- Bun (package manager)
- React + TypeScript + Vite
- Tailwind v4
- Tauri v2 (Rust)
- Zustand (state)

---

## Immediate Next Steps

### Wave 1: Header + Snapshot Removal

1. **Add browser mode toggle to Header.tsx**
   - Location: Find appropriate place in Header component
   - Use: `toggleBrowserChatLayoutMode()` from useUIStore
   - Display current mode via `resolveBrowserChatLayoutMode()`
   - Theme: Use interactive colors from theme-system

2. **Remove snapshot panel from BrowserView.tsx**
   - Lines 636-668 contain "Latest Snapshot" section
   - Keep action API (`handleUseSnapshot`, runAction('snapshot')) - only remove UI
   - Keep backend snapshot functionality for compatibility

### Wave 2: Zen Tabs

3. **Create BrowserTabStrip.tsx**
   - New file: `packages/ui/src/components/browser/BrowserTabStrip.tsx`
   - Features: horizontal scroll, active highlight, close button, new tab, pinned support

4. **Create BrowserTabChip.tsx**
   - New file: `packages/ui/src/components/browser/BrowserTabChip.tsx`
   - Subcomponent for individual tab rendering

5. **Integrate into BrowserView**
   - Replace existing page `<select>` dropdown with BrowserTabStrip

### Wave 3: Selection Bubble

6. **Add desktop_browser_selection_state command**
   - Location: packages/desktop/src-tauri/src/main.rs
   - Returns: { text, bounds?, timestamp, pageUrl, pageTitle }
   - Evaluate JS in active webview to get selection

7. **Create BrowserSelectionBubble.tsx**
   - New file: `packages/ui/src/components/browser/BrowserSelectionBubble.tsx`
   - Shows when selection exists
   - Actions: "Ask KronosCoder", "Run OpenBrowser Task", "Run E2B Task"

8. **Integrate into BrowserView**
   - Add bubble over selected text
   - Wire to desktop command for selection state

---

## Verification Steps

After completing all tasks:
1. `bun run type-check` - Must pass
2. `bun run lint` - Must pass
3. `bun run build` - Must pass
4. Manual verification of all features

---

## Decisions Made

1. **Tri-mode**: Already implemented in store and MainLayout, only needed to add UI control in Header
2. **Snapshot**: Plan to REMOVE the UI panel but keep backend support for compatibility
3. **Zen tabs**: New component needed - existing page dropdown should be replaced
4. **Selection bubble**: New feature requiring both Rust (desktop) and React (UI) changes

---

## Potential Gotchas

1. **Theme enforcement**: Any new UI MUST use theme-system tokens - no hardcoded colors
2. **Desktop commands**: New command needs proper error handling for when webview is not available
3. **Bubble positioning**: Need to handle overflow and ensure bubble doesn't go off-screen
4. **Tab state**: Must sync with existing desktop browser tab state management

---

## References

- Plan document: `.sisyphus/plans/kronoschamber-runtime-reliability.md`
- Theme system: Use `skill({ name: "theme-system" })` for styling
- Existing components: FloatingRuntimeWidget, RuntimeStrip, RuntimeContextPanel (already exist)
