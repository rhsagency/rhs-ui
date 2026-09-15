<p align="center">
  <a href="https://rhsui.com"><img src="./.github/rhs-ui-logo.svg" alt="RHS UI" width="280"></a>
</p>

<p align="center">
  Open-source components and blocks for React and Next.js.<br>
  Install with the shadcn CLI. Own the source.
</p>

<p align="center">
  <a href="https://rhsui.com">rhsui.com</a> ·
  <a href="https://rhsui.com/docs">Documentation</a> ·
  <a href="https://rhsui.com/components">Components</a> ·
  <a href="https://rhsui.com/pro">Pro</a>
</p>

---

**RHS UI** is a production-ready component ecosystem for React and Next.js: its own
primitives, and on top of them the components real applications need. Commerce
(product cards, variant selectors, cart drawers), dashboard (KPI cards), application UI
(command palettes, empty states, file dropzones) and marketing sections. Every item is
copied into your project by the [shadcn CLI](https://ui.shadcn.com/docs/cli) and lives
in an `rhs-ui/` folder you own, next to whatever else you use.

This repository is the **free, open-source** tier (MIT). **RHS UI Pro** is a separate,
paid product with premium templates, complete dashboards and commerce flows; its
source lives in a private repository and is never part of this one.

## Install

Any project set up with `npx shadcn@latest init` can install an item directly:

```bash
npx shadcn@latest add https://rhsui.com/r/product-card.json
```

Prefer the short form? Register the namespace once:

```bash
npx shadcn@latest registry add @rhs-ui=https://rhsui.com/r/{name}.json
npx shadcn@latest add @rhs-ui/product-card
```

The CLI installs the item, the RHS UI primitives it composes
(`components/ui/rhs-ui/`), and the npm packages it needs. The files are yours: edit
them.

```tsx
import { ProductCard } from "@/components/rhs-ui/product-card/product-card";
```

Without rhsui.com: every built item is committed under [`public/r/`](./public/r) and
installs from its raw GitHub URL too.

## What is in the registry

| Layer | Items |
| --- | --- |
| Primitives (`components/ui/rhs-ui/`) | icons, button, badge, skeleton, separator, kbd, input, label, tooltip, dialog, sheet, tabs, command |
| Commerce | product-card, variant-selector, cart-drawer, product-gallery |
| Dashboard | kpi-card |
| Application | empty-state, command-palette, file-dropzone |
| Marketing | pricing-section |
| Theme | rhs-ui-theme |

The catalogue: [`public/r/registry.json`](./public/r/registry.json). Browse with
previews and docs at [rhsui.com/components](https://rhsui.com/components).

## Principles

- **Own the source.** No package to update, no version to chase. The code is in your
  repository the moment you install it.
- **Beyond primitives.** The value is in the compositions production apps need, built
  on one coherent set of primitives with one drawing hand.
- **Data in, callbacks out.** Items take plain data and call you back. They never
  fetch, never read environment variables, never depend on a state library.
- **Accessible by default.** Keyboard, focus, roles, contrast and reduced motion are
  part of every item, not an afterthought.
- **Light and dark from one token set.** Items use semantic tokens
  (`bg-background`, `text-muted-foreground`, `bg-primary`) so they follow your theme;
  `rhs-ui-theme` gives you the RHS palette if you want it.

## Repository layout

```
registry.json              the registry root (name, homepage, include)
registry/<category>.json   one fragment per category
registry/rhs-ui/           the source: ui/, components/, hooks/, examples/
public/r/                  built output, one JSON per item, committed
scripts/                   build and gates
```

## Development

```bash
pnpm install
pnpm check            # typecheck + registry gate
pnpm registry:build   # rebuild public/r (commit the result)
pnpm test:install     # install every item into scratch Next projects (Base UI and Radix) and typecheck
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how an item is built and what we accept.

## Licence

Open-source components in this repository are available under the
[MIT License](./LICENSE). The RHS UI name and logo are trademarks of RHS Agency and
are not covered by the MIT licence. RHS UI Pro is licensed separately.

RHS UI is designed, built and maintained by [RHS Agency](https://www.rhsagency.nl),
an independent software agency based in the Netherlands.
