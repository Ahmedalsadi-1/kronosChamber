# Desktop Agent Runtime Spec

## Scope
- Runtime: desktop-first KronosChamber shell with managed KronosCode.
- Target connectors: `openbrowser` and `e2b`.
- Goal: normalize connector output into a single runtime task model and stream updates to chat UI.

## Task Lifecycle
- `queued`: task accepted and registered.
- `running`: connector execution started.
- `done`: connector execution finished (success or error).

## Canonical Task Model
```ts
type AgentRuntimeTask = {
  taskID: string;
  mode: "e2b" | "openbrowser" | "desktop-browser";
  status: "queued" | "running" | "done";
  success: boolean | null;
  prompt: string;
  sessionID: string | null;
  providerID: string | null;
  modelID: string | null;
  agentName: string | null;
  connector: {
    mode: "e2b" | "openbrowser" | "desktop-browser";
    kind: "api" | "command" | "desktop";
    endpoint?: string | null;
    command?: string | null;
  } | null;
  runtimeSessionID: string | null;
  liveUrl: string | null;
  artifacts: Array<{
    id: string | null;
    name: string | null;
    path: string | null;
    url: string | null;
    mimeType: string | null;
    size: number | null;
  }>;
  logs: string[];
  error: string | null;
  result: unknown;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  updatedAt: number;
};
```

## Connector Normalization Rules
- API mode:
  - Prefer structured JSON fields from connector response.
  - Extract `runtimeSessionID` from known keys: `runtimeSessionID`, `runtime_session_id`, `sessionID`, `sessionId`.
  - Extract `liveUrl` from known keys: `liveUrl`, `live_url`, `url`, `streamUrl`.
  - Capture `logs` from `logs[]`/`log` when present.
- CLI mode:
  - Parse stdout as JSON when possible (structured path).
  - Fallback to plain stdout/stderr capture.
  - Always emit non-empty stdout/stderr excerpts as `logs`.

## API Surfaces (Unified Runtime)
- `GET /api/runtime/status`
  - Returns current mode, connectors, and running task counts.
- `POST /api/runtime/task`
  - Canonical task creation (proxies to `/api/agent-mode/task`).
- `GET /api/runtime/tasks`
  - Lists recent tasks for hydration.
- `GET /api/runtime/task/:taskID`
  - Details for a single task.
- `POST /api/runtime/browser/action`
  - Proxy for browser actions (click, type, navigate).
- `GET /api/runtime/browser/state`
  - Proxy for current browser state (url, title, pages).

## Settings Extensions (Desktop UX)
- `agentModeByProject: Record<string, "e2b" | "openbrowser" | "desktop-browser">`
  - Project-scoped preferred runtime mode, auto-applied on directory switch.
- `browserChatLayoutMode: "split" | "browser-only" | "chat-only"`
  - Controls visibility of browser vs chat panel.
- `browserOpenAtStartup: boolean`
  - Opens Browser tab automatically during desktop startup.

## Event Surface
- Existing SSE stream: `/api/global/event`.
- Event type: `openchamber:agent-mode-task`.
- Event payload contract:
```ts
{
  type: "openchamber:agent-mode-task",
  properties: {
    task: AgentRuntimeTask,
    reason: "queued" | "running" | "done" | "updated",
    timestamp: number
  }
}
```

## Widget Placement Matrix
- Browser tab open:
  - floating runtime widget anchors bottom-right over chat area.
- Browser tab closed (chat-only):
  - floating runtime widget anchors centered above chat input area.
- Expansion behavior:
  - expands to runtime context panel mode (`runtime`) with tabs `Live`, `Files`, `Logs`.

## Runtime Panel UI Mapping
- `Live` tab:
  - embeds `liveUrl` when present and exposes `Open live`.
- `Files` tab:
  - lists normalized `artifacts`.
  - file click opens chooser with default `Open in Side Panel`.
- `Logs` tab:
  - displays latest merged connector logs.

## UI Mapping Rules
- Chat runtime card reads canonical task model directly.
- Rendering priorities:
  1. `running` tasks first.
  2. Most recently `updatedAt` next.
- Status semantics:
  - `queued/running`: live badge.
  - `done + success=true`: complete badge.
  - `done + success=false`: error badge + error text.
- Live links:
  - Always show `Open live`; disable when `liveUrl` is unavailable.
- Task actions:
  - `Clone task` prefills `/desktoptask <mode> <prompt>` into chat input.
  - `Resume` in chat footer restores the latest runtime context.
- Failure UX:
  - Map common connector/runtime errors to actionable triage hints in-card.
