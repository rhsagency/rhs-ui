# Contributing to RHS UI

Thanks for considering it. This document is short on purpose: enough to make a
good contribution easy, not enough to make a simple fix a chore.

## What we accept

- **Bug fixes** to existing items, with a description of the failing case.
- **Accessibility and correctness improvements** (keyboard, focus, roles,
  contrast, reduced motion). These are never too small.
- **New items** that fit a category (primitives, icons, application, commerce,
  dashboard, marketing) and add value above the shadcn primitives. Open an issue
  first using the "Component request" template so we can agree on scope before you
  build it.

We do not accept re-implementations of shadcn/ui primitives, items that fetch
data or read environment variables, or items that depend on a specific state
library.

**Everything in this repository is the free tier**, so every item carries
`meta.tier: "free"` and the gate enforces it. An item belongs here when something
free needs it (a primitive, the icon set, an engine) or when it does one job: one
control, one component, at most two states. Whole flows, complete screens and
animated icons that tell a process in stages belong to RHS UI Pro, which is a
separate repository. Nothing here is ever a cut-down version of a Pro item.

## How an item is built

Every item lives in the folder of its category and follows the same contract (see
`docs/ARCHITECTURE.md`):

- **Where it goes.** `registry/<category>/<name>.tsx`, or a folder with an
  `index.tsx` when it has several files. Its entry goes in
  `registry/<category>/registry.json`, and every file gets
  `"target": "components/rhs-ui/<category>/<same path>"`.
- **RHS UI's own code, top to bottom.** Items compose the RHS UI primitives
  (`@rhs-ui/primitives/button`, `@rhs-ui/primitives/dialog` and so on) and icons
  (`@rhs-ui/icons`), never shadcn/ui components. Headless behaviour comes from the
  unified `radix-ui` package; `cn` from the consumer's `@/lib/utils`.
- **Imports use the one alias**, `@rhs-ui/<category>/<name>`, and every RHS UI item a
  file imports is declared as an absolute URL in `registryDependencies`
  (`https://rhsui.com/r/button.json`). Never a bare name, never `@rhs-ui/...` there.
- No `lucide-react`, `cn`, `shadcn`, `@base-ui/*` or scoped `@radix-ui/*`
  dependencies. `pnpm check:registry` enforces all of this.
- Data in, callbacks out. Plain data props, no fetching, no global state.
- Server Component by default; `"use client"` only where there is state, and
  as small an island as possible.
- Loading, empty and error states where the item can be in that state.
- Keyboard reachable, visible focus, correct roles, works in light and dark, and
  still for a visitor who asks for reduced motion.
- TypeScript strict, `noUncheckedIndexedAccess`, no `any`, no `enum`.
- Every item has a demo (`registry/examples/<name>-demo.tsx`) and an entry with
  `title`, `description`, `categories`, `meta.tier`, `meta.version`, `meta.since`,
  `meta.status`, `dependencies` with versions and `docs`.

A new icon is drawn in `registry/icons/index.tsx` with `Glyph`, on the 24 grid with a
1.75px stroke, and looked at on 16, 22, 34 and 48px before it is proposed.

## Workflow

```bash
pnpm install
pnpm check            # typecheck + registry gate + button SSR test
pnpm registry:build   # regenerates registry.json and public/r/*.json (commit the result)
pnpm test:install     # installs every item into Base UI and Radix scratch projects and typechecks
```

Commit messages follow conventional commits (`feat(commerce): add product-gallery`,
`fix(kpi-card): announce delta sign`). One item per pull request. CI runs the
same gates; a PR with a stale `public/r/` will fail.

## Licence

By contributing you agree that your contribution is licensed under the MIT
License of this repository. Do not contribute code you do not have the right
to license this way.
