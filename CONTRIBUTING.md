# Contributing to RHS UI

Thanks for considering it. This document is short on purpose: enough to make a
good contribution easy, not enough to make a simple fix a chore.

## What we accept

- **Bug fixes** to existing items, with a description of the failing case.
- **Accessibility and correctness improvements** (keyboard, focus, roles,
  contrast, reduced motion). These are never too small.
- **New items** that fit the taxonomy (core, application, commerce, dashboard,
  marketing) and add value above the shadcn primitives. Open an issue first
  using the "Component request" template so we can agree on scope before you
  build it.

We do not accept re-implementations of shadcn/ui primitives, items that fetch
data or read environment variables, or items that depend on a specific state
library.

## How an item is built

Every item lives in `registry/rhs-ui/` and follows the same contract (see
`docs/ARCHITECTURE.md`):

- **RHS UI's own code, top to bottom.** Items compose the RHS UI primitives in
  `registry/rhs-ui/ui/rhs-ui/` (button, dialog, sheet, icons and so on), never
  shadcn/ui components. Headless behaviour comes from the unified `radix-ui`
  package; icons from the `icons` item; `cn` from the consumer's `@/lib/utils`.
- Files import each other through `@/registry/rhs-ui/...` paths (the CLI
  rewrites them to the consumer's aliases) and declare every RHS UI item they
  use as an absolute URL in `registryDependencies`
  (`https://rhsui.com/r/button.json`). Never a bare name, never `@rhs-ui/...`.
- Every file has an explicit `target` under an `rhs-ui/` folder.
- No `lucide-react`, `cn`, `shadcn`, `@base-ui/*` or scoped `@radix-ui/*`
  dependencies. `pnpm check:registry` enforces all of this.
- Data in, callbacks out. Plain data props, no fetching, no global state.
- Server Component by default; `"use client"` only where there is state, and
  as small an island as possible.
- Loading, empty and error states where the item can be in that state.
- Keyboard reachable, visible focus, correct roles, works in light and dark.
- TypeScript strict, `noUncheckedIndexedAccess`, no `any`, no `enum`.
- Every item has a demo (`registry/rhs-ui/examples/<name>-demo.tsx`) and an
  entry in the category fragment (`registry/<category>.json`) with `title`,
  `description`, `categories`, `meta.tier`, `meta.version`, `meta.since`,
  `meta.status`, `dependencies` with versions and `docs`.

## Workflow

```bash
pnpm install
pnpm check            # typecheck + registry gate
pnpm registry:build   # regenerates public/r/*.json (commit the result)
pnpm test:install     # installs every item into Base UI and Radix scratch projects and typechecks
```

Commit messages follow conventional commits (`feat(commerce): add product-gallery`,
`fix(kpi-card): announce delta sign`). One item per pull request. CI runs the
same gates; a PR with a stale `public/r/` will fail.

## Licence

By contributing you agree that your contribution is licensed under the MIT
License of this repository. Do not contribute code you do not have the right
to license this way.
