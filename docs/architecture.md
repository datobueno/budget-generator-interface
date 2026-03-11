# Architecture

## Goals
- Keep domain logic out of page composition.
- Keep reusable primitives separate from business logic.
- Make the repo readable for external contributors.
- Allow incremental refactors without rewriting the app.

## Layers

### `app`
Application bootstrap and top-level providers.

### `pages`
Screen composition. Pages are allowed to compose features and entities, but they should not become the source of truth for domain logic.

Rule: do not add new business logic to `src/App.tsx`. Keep it as a thin adapter around page-level components.

Current page-level ownership:
- `src/pages/quote-editor/page.tsx` is the main screen composition layer.
- `src/pages/quote-editor/model/*` contains page-scoped orchestration hooks for Google, imports, PDF export, notices, and sheet navigation.
- Page-local `model/*` is transitional. Stable workflows should continue moving into `features/*` when their public surface is clear.

### `shared`
Cross-cutting building blocks that are not specific to a single domain:
- reusable UI wrappers
- generic utilities
- constants
- shared hooks
- shared types

`src/components/ui` is intentionally kept as the physical shadcn/ui layer and is not moved.

### `entities`
Stable domain contracts and pure logic:
- `quote`
- `client`
- `concept`
- `currency`
- `tax`

Entities may depend on `shared`, but must not depend on `features`.

Additional entity ownership:

### `features`
User-facing workflows and integrations:
- `client-details`
- `quote-builder`
- `quote-preview`
- `spreadsheet-import`
- `google-contacts`
- `google-sheets`
- `invoice-taxes`
- `pdf-export`

Features may depend on `entities` and `shared`, but not on other features unless there is a clear composition boundary and an explicit public entrypoint.

Additional feature ownership:
- `client-details`
  - `components/client-details-panel.tsx` renders the client block and Google Contacts composition.
- `quote-builder`
  - `components/concept-table-section.tsx` owns the sheet table composition and delegates row behavior to sortable row components.
- `quote-preview`
  - `components/budget-sheet-header.tsx` owns the budget/invoice sheet header shell.
  - `components/budget-summary-section.tsx` owns the reusable notes and totals summary block.

## Import Rules
- `pages -> features/entities/shared`
- `features -> entities/shared`
- `entities -> shared`
- `entities` never import from `features`

During migrations, temporary deep imports are allowed, but new code should prefer module entrypoints (`index.ts`).

## Public Entry Points
Each `entity` and `feature` should expose a public `index.ts`. Consumers should import from the module root whenever possible.

## Testing Strategy
- Unit tests for pure domain logic live under `tests/unit`.
- Smoke/integration tests live under `tests/integration`.
- Domain changes should ship with tests whenever the logic is pure and deterministic.

## Migration Policy
The repo is currently being migrated incrementally from a monolithic page to feature/domain modules.

Priority order:
1. public types and pure logic
2. integrations
3. page composition cleanup

Avoid rewrites. Prefer moving stable logic behind new public module boundaries while keeping the UI working at every step.

Current migration checkpoint:
- orchestration hooks were extracted from `page.tsx` into `src/pages/quote-editor/model/*`
- repeated sheet sections were extracted into `features/*` components
- `page.tsx` should stay focused on state assembly, derived data, DnD wiring, and section composition
