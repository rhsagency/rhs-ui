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

<!-- catalogue:begin -->
| Category | Import | What is in it |
| --- | --- | --- |
| Primitives | `@rhs-ui/primitives/<name>` | The building blocks, one job each: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, banner, breadcrumb, button, calendar, card, carousel, checkbox, code-block, collapsible, color-picker, combobox, command, context-menu, date-picker, description-list, dialog, dropdown-menu, file-dropzone, form-field, hover-card, input, input-group, kbd, label, marquee, menubar, meter, navigation-menu, number-input, otp-input, pagination, password-input, popover, progress, progress-ring, radio-group, rating, resizable, rhs-ui-theme, scroll-area, search-input, select, separator, sheet, sidebar-nav, skeleton, slider, spinner, stepper, switch, table, tabs, tag-input, textarea, toast, toggle, toggle-group, tooltip, tree-view |
| Icons | `@rhs-ui/icons` | 179 glyphs in one drawing hand, and 27 animated icons at `@rhs-ui/icons/animated/<name>` |
| Commerce | `@rhs-ui/commerce/<name>` | Shop UI: animated-price, product-card |
| Dashboard | `@rhs-ui/dashboard/<name>` | Dashboards and admin screens: kpi-card |
| Application | `@rhs-ui/application/<name>` | Application UI and account screens: account-settings, activity-timeline, animated-number, comparison-slider, copy-field, data-table, empty-state, preferences-panel, segmented-control, sign-in-card, step-progress |
| Marketing | `@rhs-ui/marketing/<name>` | Page sections, from the navbar to the footer: closing-cta, faq-section, feature-grid, feature-spotlight, footer-section, metrics-band, navbar, pricing-section, process-section, split-hero, testimonial-grid |
| Models | `@rhs-ui/models/<name>` | 3D model recipes and the viewer: crystal-prism, model-viewer, orbit-ring, ribbon-knot, soft-cube |
| Backgrounds | `@rhs-ui/backgrounds/<name>` | Living canvas backgrounds: architect-grid, ascii-field, beam-grid, circuit-trace, contour-field, depth-tunnel, diagonal-scan, dot-field, double-helix, film-grain, fireflies, flow-field, glyph-rain, halftone-wave, hex-pulse, isometric-blocks, light-curtain, lissajous, live-chart, moire-rings, orbit-field, oscilloscope, particle-network, ping-grid, plus-grid, polygon-bloom, radar-sweep, rain-streaks, ribbon-flow, ridge-lines, ripple-rings, rising-bubbles, signal-bars, sketch-lines, spiral-arms, starfield-drift, sunflower, warp-field, wave-mesh |
| Motion | `@rhs-ui/motion/<name>` | Scroll-driven reveals, parallax and reading progress: parallax-layer, reveal, scroll-progress, text-reveal |
<!-- catalogue:end -->

The table is generated from the registry by `pnpm registry:build`. The theme,
`rhs-ui-theme`, has no files: it writes the RHS tokens into your `globals.css`.

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

## Forms, overlays and page sections

- **Forms** share one field surface: Input, Textarea and the Select and Combobox
  triggers look and behave alike. A choice list is never the browser's native menu.
- **Floating panels** share one panel surface: Popover, Select, Dropdown menu and
  Combobox open with the same border, shadow and entrance.
- **Page sections** run from the navbar to the footer, with a sign-in card and an
  account page for the application side. Links take `linkAs` for your router.
- **Backgrounds** take `paused` and `speed`, respect reduced motion and stop rendering
  outside the viewport.

Every item has a working demo in `registry/examples/`, rendered on the server in CI.

## Development

```bash
pnpm install
pnpm check            # typecheck + registry gate + button SSR test + every demo rendered on the server
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
