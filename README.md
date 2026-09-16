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
  <a href="https://rhsui.com/icons">Icons</a> ·
  <a href="https://rhsui.com/pro">Pro</a>
</p>

---

**RHS UI** is a production-ready component ecosystem for React and Next.js: its own
primitives and icons, and on top of them the components real applications need.
Commerce (product cards, variant selectors, cart drawers), dashboard (KPI cards),
application UI (empty states, settings) and marketing sections. Every item is copied
into your project by the [shadcn CLI](https://ui.shadcn.com/docs/cli) and lives in a
`components/rhs-ui/` folder you own, next to whatever else you use.

This repository is the **free, open-source** tier (MIT). **RHS UI Pro** is a separate,
paid product with premium templates, complete dashboards and commerce flows; its
source lives in a private repository and is never part of this one.

Where the line runs: **Free gives you everything you need to build one interface
right** — the primitives, the whole icon set, the animation engine and the components
that do one job. **Pro is the bigger picture** — whole flows and finished moments.
For icons that reads as: a free animated icon answers a control (it moves on hover or
focus, loops while something happens, or switches between two states); a Pro moment
icon tells a process at 32 to 96px. Nothing in Free is a cut-down version of a Pro
item, and an item that is published here stays free.

## Install

Start with `npx shadcn@latest init`, then add one alias to `compilerOptions.paths` in
your `tsconfig.json`. Keep your existing aliases. Without a `src` directory, drop `/src`.

```json
{
  "@rhs-ui/*": ["./src/components/rhs-ui/*"]
}
```

Then install an item directly:

```bash
npx shadcn@latest add https://rhsui.com/r/product-card.json
```

Prefer the short form? Register the namespace once:

```bash
npx shadcn@latest registry add @rhs-ui=https://rhsui.com/r/{name}.json
npx shadcn@latest add @rhs-ui/product-card
```

The CLI installs the item, the RHS UI items it composes and the npm packages it needs,
all under `components/rhs-ui/`, one folder per category. The files are yours: edit them.

```tsx
import { Button } from "@rhs-ui/primitives/button";
import { IconArrowRight } from "@rhs-ui/icons";
import { IconBellAnimated } from "@rhs-ui/icons/animated/bell";
import { ProductCard } from "@rhs-ui/commerce/product-card";
```

Without rhsui.com: every built item is committed under [`public/r/`](./public/r) and
installs from its raw GitHub URL too.

## How it is organised

Every item belongs to one category. The category is its folder in this repository, its
folder in your project and the first part of its import path, so you always know where
something lives and what it is for.

| Category | Import | What is in it |
| --- | --- | --- |
| Primitives | `@rhs-ui/primitives/<name>` | The building blocks, one job each: button, badge, input, label, switch, slider, dialog, sheet, tooltip, tabs, command, accordion, skeleton, separator, kbd |
| Icons | `@rhs-ui/icons` | 179 glyphs in one drawing hand, and 27 animated icons at `@rhs-ui/icons/animated/<name>` |
| Application | `@rhs-ui/application/<name>` | Application UI: empty-state, preferences-panel |
| Commerce | `@rhs-ui/commerce/<name>` | Shop UI: product-card |
| Dashboard | `@rhs-ui/dashboard/<name>` | Dashboards and admin screens |
| Marketing | `@rhs-ui/marketing/<name>` | Marketing sections: pricing-section |

The theme, `rhs-ui-theme`, has no files: it writes the RHS tokens into your `globals.css`.
Next in the collection: variant-selector, cart-drawer and product-gallery (commerce),
kpi-card (dashboard), command-palette and file-dropzone (application).

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
registry/<category>/                  the source of one category, installed to components/rhs-ui/<category>/
registry/<category>/registry.json     the entries of that category
registry/examples/                    demos, used by rhsui.com
registry.json                         generated: every entry, merged (do not edit)
public/r/                             built output, one JSON per item, committed
scripts/                              build and gates
```

## Backgrounds and page sections

Four canvas backgrounds live under `@rhs-ui/backgrounds/`. Pass `paused` and `speed`, and place your own content inside. Each respects reduced motion and stops rendering outside the viewport.

Marketing blocks include a split hero, keyboard-accessible feature tabs, process steps, FAQs, animated metrics, pricing and a closing CTA. Application additions include segmented choices, clipboard feedback, image comparison and an event timeline. All are MIT licensed with working demos.

## Development

```bash
pnpm install
pnpm check            # typecheck + registry gate + button SSR test
pnpm registry:build   # rebuild registry.json and public/r (commit the result)
pnpm test:install     # install every item into scratch Next projects (Base UI and Radix) and typecheck
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how an item is built and what we accept.

## Licence

Open-source components in this repository are available under the
[MIT License](./LICENSE). The RHS UI name and logo are trademarks of RHS Agency and
are not covered by the MIT licence. RHS UI Pro is licensed separately.

RHS UI is designed, built and maintained by [RHS Agency](https://www.rhsagency.nl),
an independent software agency based in the Netherlands.
