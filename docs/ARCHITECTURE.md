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
every item you install is RHS UI code, in a `components/rhs-ui/` folder of your project.

## One structure: the category is the folder and the import path

Every item has one category, `categories[0]`. That category decides three things at
once, and the registry gate fails when they disagree:

```
registry/<category>/<name>.tsx           the source in this repository
components/rhs-ui/<category>/<name>.tsx  where the CLI installs it in your project
@rhs-ui/<category>/<name>                how you import it
```

| Category | Holds |
| --- | --- |
| `primitives` | the building blocks, one job each (button, input, dialog, tabs and so on) |
| `icons` | the icon set (`@rhs-ui/icons`) and the animated icons (`@rhs-ui/icons/animated/<name>`) |
| `application` | application UI: empty states, settings, uploads |
| `commerce` | shop UI: product cards, variants, carts |
| `dashboard` | dashboards and admin screens |
| `marketing` | marketing sections: pricing, heroes, features |
| `templates` | complete starters (Pro) |

A multi-file item is a folder with an `index.tsx`: `registry/commerce/product-card/`
installs as `components/rhs-ui/commerce/product-card/` and imports as
`@rhs-ui/commerce/product-card`.

```
registry.json                          generated root: name "rhs-ui", every entry (committed)
registry/<category>/registry.json      the entries of one category, one owner per file
registry/<category>/...                the source of that category
registry/examples/<name>-demo.tsx      registry:example, used by rhsui.com
public/r/<name>.json                   built output, committed
```

The same import works in this repository and in yours without the CLI rewriting
anything: this repository maps `@rhs-ui/*` to `./registry/*`, a consumer maps it to
`./src/components/rhs-ui/*`. One alias, documented once.

Each category keeps its entries in its own `registry.json` because a file named after a
category next to the folder of that category (`registry/icons.json` beside
`registry/icons/`) wins module resolution for `@rhs-ui/icons` in esbuild and bundlers.

## Rules every item follows

- **Its files live in the folder of its category** and install to
  `components/rhs-ui/<the same path>`, so an RHS UI `button` never overwrites a
  project's own `components/ui/button.tsx`.
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
- **Server Components by default;** `"use client"` only with state or effects, and
  every file that calls a hook says so.

## Icons and animated icons

The static set is one file, `registry/icons/index.tsx`: every glyph drawn on a 24 grid
with a 1.75px stroke, closed shapes opening at the top right, and `Glyph`, the frame
they are drawn in. Animated icons are one item each and share `animated-icon`:

- **Motion icons** (bell, search, refresh, cart and so on) describe their moving parts
  as Web Animations keyframes; `animated-icon.tsx` decides when they run: on hover or
  keyboard focus of the button or link around the icon, in a loop while on screen, or
  once when they appear. No animation library and no CSS to install, and nothing moves
  for a visitor who asks for reduced motion.
- **State icons** (copy into check, menu into close, sun into moon) take `active` and
  transition in CSS from `state-icon.tsx`, so they render in a Server Component.

## Gates (CI)

| Gate | Proves |
| --- | --- |
| `pnpm typecheck` | strict TypeScript with `noUncheckedIndexedAccess` |
| `pnpm check:registry` | every item complete, in the folder of its category, installing to the mirrored path, every import declared, hooks only in client files, no forbidden dependency; with planted-violation self-tests |
| `pnpm test:button` | Button renders on the server as native button, asChild link and loading state |
| `pnpm check:built` | `public/r` matches the source |
| `pnpm test:install` | every item installs into a Base UI and a Radix scratch project with the one alias, lands in `components/rhs-ui/<category>/` and typechecks |

A gate that cannot fail is not a gate: each one is run against a known-broken state
before it is trusted.

## Versioning

The registry is versioned as a whole with git tags (`v0.x.y`) and `CHANGELOG.md`.
Each item carries `meta.version`, bumped only when its files change. rhsui.com pins a
tag; the CLI installs whatever the URL serves, which is always the latest tag.
