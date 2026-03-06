# Browser Parity Spec (Desktop-First, Strict)

## Scope
- Source reference app: `/Users/albsheralsadi/kronosfinal` (hello-halo)
- Target apps:
  - `/Users/albsheralsadi/kronosfinal/kronosChamber`
  - `/Users/albsheralsadi/kronosfinal/kronoscoder`
- Lock: hello-halo is reference-only and must remain untouched.
- Lock: parity target is strict user-visible behavior + workflow parity, not Electron internals.

## Source Mapping (Hello-Halo)
- Browser runtime manager: `/Users/albsheralsadi/kronosfinal/src/main/services/browser-view.service.ts`
- Browser IPC: `/Users/albsheralsadi/kronosfinal/src/main/ipc/browser.ts`
- AI browser MCP server: `/Users/albsheralsadi/kronosfinal/src/main/services/ai-browser/sdk-mcp-server.ts`
- Browser viewer UI: `/Users/albsheralsadi/kronosfinal/src/renderer/components/canvas/viewers/BrowserViewer.tsx`

## Target Mapping (KronosChamber + KronosCoder)
- Browser UI: `/Users/albsheralsadi/kronosfinal/kronosChamber/packages/ui/src/components/views/BrowserView.tsx`
- Browser client API: `/Users/albsheralsadi/kronosfinal/kronosChamber/packages/ui/src/lib/opencode/client.ts`
- Browser runtime store: `/Users/albsheralsadi/kronosfinal/kronosChamber/packages/ui/src/stores/useBrowserRuntimeStore.ts`
- Experimental browser routes: `/Users/albsheralsadi/kronosfinal/kronoscoder/packages/opencode/src/server/routes/experimental.ts`
- Browser runtime core: `/Users/albsheralsadi/kronosfinal/kronoscoder/packages/opencode/src/browser/runtime.ts`
- AI browser tool registry: `/Users/albsheralsadi/kronosfinal/kronoscoder/packages/opencode/src/tool/ai_browser.ts`

## Strict Pass/Fail Matrix

### Controls
| Item | Pass Criteria | Status |
| --- | --- | --- |
| Back | Disabled when not possible, action succeeds when history exists | Pending |
| Forward | Disabled when not possible, action succeeds when history exists | Pending |
| Reload/Stop | Button toggles based on loading state | Pending |
| Home | Opens default home URL | Pending |
| New page | Creates and selects a new page | Pending |
| Close page | Closes selected page and prevents closing last page | Pending |
| Page picker | Lists pages, updates active page selection | Pending |
| Open external | Opens active page in external/desktop window | Pending |
| Capture | Captures screenshot and shows latest frame | Pending |
| Snapshot | Fetches latest DOM snapshot text | Pending |

### Address Rules
| Item | Pass Criteria | Status |
| --- | --- | --- |
| Full URL passthrough | `scheme://host/path` stays unchanged | Pending |
| Domain normalization | `example.com` becomes `https://example.com` | Pending |
| Localhost/IP normalization | `localhost:3000` / `127.0.0.1:3000` become `http://...` | Pending |
| Search fallback | Plain text routes to Bing query URL | Pending |

### Page Lifecycle + State
| Item | Pass Criteria | Status |
| --- | --- | --- |
| Multi-page session model | Runtime state returns stable `pages[]` + `activePageID` | Pending |
| Loading indicator | UI indicates active loading state and stop availability | Pending |
| Navigation flags | UI reflects `canGoBack` and `canGoForward` from runtime | Pending |
| Runtime errors | Per-page/runtime errors visible with retry path | Pending |
| Disabled fallback | Browser disabled mode shows deterministic disabled UX | Pending |

### Snapshot + Runtime Cards
| Item | Pass Criteria | Status |
| --- | --- | --- |
| Latest snapshot panel | **REMOVED** - snapshot backend action still supported for compatibility | **Removed (2026-02-28)** |
| Use latest snapshot | **REMOVED** - snapshot backend action still supported for compatibility | **Removed (2026-02-28)** |
| Runtime card placement | Runtime task card appears in chat stream near latest turn | Pending |
| Runtime card lifecycle | Queued/running/done states visible and updated in near real time | Pending |
| Runtime card clone | Card offers one-click clone into `/desktoptask` prompt | Implemented |
| Runtime open-live affordance | Open-live action is visible in every card state | Implemented |
| Failure triage hint | Failed task card shows actionable next-step hint | Implemented |

### Runtime Widget + File Open Chooser
| Item | Pass Criteria | Status |
| --- | --- | --- |
| Floating runtime widget (browser split) | Widget appears bottom-right over chat area while runtime is queued/running and Browser tab is active | Pending |
| Floating runtime widget (chat-only) | Widget appears centered above chat input while runtime is queued/running and Browser tab is closed (chat-only) | Pending |
| Runtime widget expansion | Expand action opens runtime context panel mode (`runtime`) with `Live`, `Files`, `Logs` tabs | Pending |
| File open chooser (SidebarFilesTree) | Single-click file opens chooser with `Open in Side Panel` preselected, and all three actions (`Open in Side Panel`, `Open in Files Tab`, `Open Externally`) execute correctly | Pending |
| File open chooser (FilesView tree) | Single-click file opens chooser with `Open in Side Panel` preselected, and all three actions (`Open in Side Panel`, `Open in Files Tab`, `Open Externally`) execute correctly | Pending |

### Fallback + Reliability
| Item | Pass Criteria | Status |
| --- | --- | --- |
| Browser events stream | `/experimental/browser/events` drives updates | Implemented |
| Stream failover behavior | SSE disconnect triggers progressive recovery (backoff -> interconnect -> soft resync) | Implemented |
| Poll fallback | Poll loop keeps UI usable during stream interruptions | Implemented |
| Agent task hydration | Reload restores tasks via `/api/agent-mode/tasks` | Implemented |
| Startup conflict handling | Desktop dev startup recovers from stale `:3001` listeners | Implemented |
| Live desktop command availability | Desktop browser command path remains active when desktop shell is valid and not silently downgraded due to origin edge cases, ensuring browser-command-specific readiness check using desktop-shell runtime signal in addition to local-origin match. | Implemented |
| Browser runtime status badge | Browser view explicitly shows `Live desktop browser active` or `AI relay fallback` | Pending |

### Runtime UX + 10x Features (2026-03-01)
| Item | Pass Criteria | Status |
| --- | --- | --- |
| Tri-mode layout switch | Switch between `split`, `browser-only`, and `chat-only` with persistence | Implemented |
| Zen tab strip | Top horizontal scrollable tab strip replaces select dropdown | Implemented |
| Selection bubble | Selecting text in browser shows AI action bubble (Ask/Task) | Implemented |
| Snapshot panel removal | Browser View no longer displays legacy snapshot UI blocks | Implemented |
| Unified runtime SDK | UI/Agent logic uses single `runtimeSdk` for all modes | Implemented |
| Resume last runtime | Input footer has resume control that reopens live runtime or restores command | Implemented |
| Sticky runtime per project | Preferred `agentMode` persists by project directory and auto-applies on switch | Implemented |
| Browser open at startup | Desktop can auto-open Browser tab when startup toggle is enabled | Implemented |
