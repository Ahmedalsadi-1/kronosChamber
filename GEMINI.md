# OpenChamber - Project Context & Instruction

OpenChamber is a multi-platform (Web, Desktop, VS Code) suite of user interfaces for the **OpenCode** AI coding agent. It provides a visual layer for agent interaction, including chat timelines, tool output rendering, terminal integration, and voice control.

## Project Overview

- **Core Functionality**: Provides rich UI runtimes that connect to an OpenCode server via HTTP/SSE.
- **Architecture**: A monorepo workspace managed with Bun.
- **Key Features**:
    - **Cross-runtime continuity**: Consistent session state across TUI, Web, and Desktop.
    - **Smart Tool UIs**: Specialized views for diffs, file operations, and git workflows.
    - **Multi-agent management**: Running parallel agents from a single prompt.
    - **Theme System**: Highly customizable theme engine (Skill-based).

## Repository Structure

The project is organized into `packages/*`:

- `packages/ui`: Shared React/TypeScript component library using Tailwind v4. Core state management (Zustand) lives here.
- `packages/web`: Main Express server and client web application. Includes the CLI tool (`openchamber`).
- `packages/desktop`: Tauri v2 macOS application that bundles the web server as a sidecar.
- `packages/vscode`: VS Code extension integration with an embedded webview runtime.
- `video`: Remotion-based project for generating promo and instructional videos.

## Tech Stack

- **Runtimes**: Bun (Preferred), Node.js >= 20.
- **Frontend**: React 19, TypeScript, Vite, Tailwind v4.
- **Backend**: Express.js (in `packages/web/server`).
- **Desktop**: Tauri v2 (Rust backend, React frontend).
- **State**: Zustand.
- **UI Components**: Radix UI, HeroUI, Remixicon.
- **Communication**: HTTP + Server-Sent Events (SSE) via `@opencode-ai/sdk`.

## Development Workflows

### Setup & Installation
```bash
bun install
```

### Key Commands (Root)
- **Development**: `bun run dev` (Runs server, web build, and UI dev concurrently)
- **Build All**: `bun run build`
- **Lint**: `bun run lint`
- **Type-Check**: `bun run type-check`
- **Clean**: `bun run clean`

### Runtime Specific Commands
- **Desktop Dev**: `bun run desktop:dev`
- **Desktop Build**: `bun run desktop:build`
- **VS Code Dev**: `bun run vscode:dev`
- **Web Build**: `bun run build:web`

## Core Instructions for AI Agents

1. **Theme System**: Always use the theme system for UI changes. Do not use hardcoded colors. Use `skill({ name: "theme-system" })` to understand tokens.
2. **Runtime Consistency**: Ensure backend changes are consistent across Web, Desktop, and VS Code runtimes where applicable.
3. **Green Baseline**: Before finalizing any PR or change, verify with `bun run type-check` and `bun run lint`.
4. **Tool Selection**: Use `simple-git` for git operations in the backend and `bun-pty`/`node-pty` for terminal integrations.
5. **UI Patterns**: Refer to `AGENTS.md` for specific file paths for Settings, Chat, and Terminal UI patterns.

## Important Constraints
- **OpenCode SDK**: Do not modify the underlying SDK logic if it resides in an external repository (\`../opencode\`).
- **Secrets**: Never commit `.env` files or API keys.
- **Testing**: Run `scripts/test-release-build.sh` for release smoke testing.
