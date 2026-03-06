# Development Rules

## Scope and Consistency
- Keep diffs tight and avoid drive-by refactors.
- For backend changes, keep web/desktop/vscode runtimes consistent when behavior overlaps.
- Follow local precedent; inspect nearby code before introducing new patterns.

## TypeScript and React
- Avoid `any` and blind type casts.
- Keep TypeScript and ESLint clean for touched code.
- Prefer function components and hooks; use classes only where necessary (for example, error boundaries).
- Avoid nested ternaries; prefer early returns with `if/else` or `switch`.

## Styling and UI Conventions
- Styling stack is Tailwind v4.
- Typography patterns live in `packages/ui/src/lib/typography.ts`.
- Theme variables and generation live under `packages/ui/src/lib/theme/`.
- Use the project toast wrapper from `@/components/ui` (`packages/ui/src/components/ui/toast.ts`); do not import `sonner` directly in feature code.

## Dependency and Security Guardrails
- Do not add new dependencies unless explicitly requested.
- Never add secrets (`.env`, keys) or log sensitive data.
