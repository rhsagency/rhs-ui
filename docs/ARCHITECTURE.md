# RHS UI architecture (public repository)

This is the public half of the picture: how the open-source registry is built and
why. The full set of architecture decisions (website, Pro boundary, data, licensing)
lives with the website and is not needed to use or contribute to this repository.

## Three repositories

| Repository | Visibility | Role |
| --- | --- | --- |
| `rhsagency/rhs-ui` (this one) | public, MIT | the free, open-source components and the registry |
| `rhsagency/rhs-ui-website` | private | rhsui.com: docs, explorer, previews |
| `rhsagency/rhs-ui-pro` | private, commercial | RHS UI Pro: premium templates, dashboards, flows |

Nothing from the private repositories is ever in this one. This repository depends on
nothing of ours; the website depends on it.

## Distribution: the shadcn registry format, RHS UI's own code

The shadcn CLI and its registry format are the distribution channel. shadcn/ui
components are not a dependency. RHS UI ships its own primitives (built on the
unified `radix-ui` package where a headless behaviour is needed) and its own icons;
every item you install is RHS UI code, in an `rhs-ui/` folder of your project.

```
registry.json                       root: name "rhs-ui", homepage, include per category
registry/<category>.json            one fragment per category
registry/rhs-ui/
  ui/rhs-ui/<name>.tsx              registry:ui        -> components/ui/rhs-ui/<name>.tsx
  components/rhs-ui/<name>/...      registry:component -> components/rhs-ui/<name>/...
                                    registry:block     -> same place, larger composition
  hooks/rhs-ui/use-<name>.ts        registry:hook      -> hooks/rhs-ui/use-<name>.ts
  examples/<name>-demo.tsx          registry:example   (used by rhsui.com)
public/r/<name>.json                built output, committed
```

The on-disk tree mirrors the consumer's tree so the CLI's import rewriting lands every
import in the right place: `@/registry/rhs-ui/ui/rhs-ui/button` becomes
`@/components/ui/rhs-ui/button`, `@/lib/utils` becomes your project's `cn`.

## Rules every item follows

- **Explicit `target` under an `rhs-ui/` folder** on every file, so an RHS UI `button`
  never overwrites a project's existing `components/ui/button.tsx`.
- **Dependencies on other RHS UI items are absolute URLs**
  (`https://rhsui.com/r/<name>.json`). A bare name would mean a shadcn built-in; a
  namespaced name would fail for a consumer who installed by URL.
- **npm dependencies are declared with a version** and never include `lucide-react`,
  `cn`, `shadcn`, `@base-ui/*` or scoped `@radix-ui/*` packages (use `radix-ui`).
- **Data in, callbacks out.** No fetching, no `process.env`, no state library, no
  import from rhsui.com. Money arrives formatted; images go through a `renderImage`
  slot.
- **The RHS component form:** function components, CVA variants, `data-slot` on
  every part, `cn` from `@/lib/utils`, `asChild` through Radix `Slot`, semantic token
  classes only, named transition properties, a full state cycle.
- **Accessible:** keyboard reachable, visible focus, correct roles, text next to
  colour, reduced motion respected, transforms and opacity only.
- **Server Components by default;** `"use client"` only with state or effects.

## Gates (CI)

| Gate | Proves |
| --- | --- |
| `pnpm typecheck` | strict TypeScript with `noUncheckedIndexedAccess` |
| `pnpm check:registry` | every item complete, every import declared, no forbidden dependency, targets under `rhs-ui/`; has a planted-violation self-test |
| `pnpm check:built` | `public/r` matches the source |
| `pnpm test:install` | every item installs into a Base UI and a Radix scratch project and typechecks |

A gate that cannot fail is not a gate: each one is run against a known-broken state
before it is trusted.

## Versioning

The registry is versioned as a whole with git tags (`v0.x.y`) and `CHANGELOG.md`.
Each item carries `meta.version`, bumped only when its files change. rhsui.com pins a
tag; the CLI installs whatever the URL serves, which is always the latest tag.
