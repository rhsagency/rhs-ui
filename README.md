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
paid product with finished widgets, complete dashboards, commerce flows and templates; its
source lives in a private repository and is never part of this one.

Where the line runs: **Free is the foundation**: the primitives you build every
interface from, the interface icons, the animation and canvas engines, scroll basics
and a set of marketing sections to put a page together. **Pro is the bigger picture**:
finished widgets, whole screens and flows, dashboards, commerce, the wider icon
library and the scroll sections. In every library roughly 40% is free and 60% is Pro.
Nothing in Free is a cut-down version of a Pro item, and Free never depends on Pro.
Items can move from Free to Pro in a release; a copy you installed under MIT stays
yours under MIT.

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
npx shadcn@latest add https://rhsui.com/r/pricing-section.json
```

Prefer the short form? Register the namespace once:

```bash
npx shadcn@latest registry add @rhs-ui=https://rhsui.com/r/{name}.json
npx shadcn@latest add @rhs-ui/pricing-section
```

The CLI installs the item, the RHS UI items it composes and the npm packages it needs,
all under `components/rhs-ui/`, one folder per category. The files are yours: edit them.

```tsx
import { Button } from "@rhs-ui/primitives/button";
import { IconArrowRight } from "@rhs-ui/icons";
import { IconBellAnimated } from "@rhs-ui/icons/animated/bell";
import { PricingSection } from "@rhs-ui/marketing/pricing-section";
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
| Primitives | `@rhs-ui/primitives/<name>` | The building blocks, one job each: accordion, alert, alert-dialog, anchor-nav, aspect-ratio, auto-grid, avatar, back-to-top, badge, banner, bottom-nav, breadcrumb, breadcrumb-collapsed, button, calendar, callout, card, carousel, checkbox, checkbox-cards, checkbox-group, code-block, collapsible, color-picker, combobox, command, confirm-popover, context-menu, country-select, currency-input, date-picker, date-range-picker, date-time-picker, description-list, dialog, drawer, dropdown-menu, duration-input, empty-search, feature-badge, file-dropzone, file-trigger, form-field, fullscreen-dialog, hover-card, inline-confirm, input, input-group, kbd, label, labeled-divider, load-more, loading-dots, marquee, media-object, menubar, meter, mobile-menu, month-picker, multi-select, navigation-menu, notification-badge, number-input, opening-hours, otp-input, page-header, page-size-pagination, pager-nav, pagination, password-input, phone-input, popover, progress, progress-ring, pull-quote, radio-cards, radio-group, range-slider, rating, resizable, result-state, rhs-ui-theme, scroll-area, scroll-tabs, search-input, search-trigger, section-heading, select, separator, settings-row, sheet, sidebar-nav, skeleton, skip-link, slider, spinner, stepper, switch, switch-group, table, table-of-contents, tabs, tag-input, term-tooltip, textarea, textarea-counter, time-picker, toast, toggle, toggle-group, toolbar, tooltip, tree-view, unit-input, vertical-tabs |
| Icons | `@rhs-ui/icons` | 323 glyphs in one drawing hand, and 77 animated icons at `@rhs-ui/icons/animated/<name>` |
| Commerce | `@rhs-ui/commerce/<name>` | Shop UI: animated-price, product-card |
| Application | `@rhs-ui/application/<name>` | Application UI and account screens: animated-number, copy-field, empty-state, segmented-control |
| Marketing | `@rhs-ui/marketing/<name>` | Page sections, from the navbar to the footer: announcement-bar, app-download-hero, app-hero, article-layout, awards-row, blog-featured, blog-grid, blog-list, careers-list, centered-hero, changelog-list, closing-cta, collage-hero, contact-cards, contact-section, cookie-banner, cta-banner, cta-checklist, cta-image-band, download-section, editorial-hero, faq-columns, faq-section, faq-tabs, feature-alternating, feature-checklist, feature-grid, feature-icon-row, feature-image-cards, feature-numbers, feature-spotlight, feature-tabs, footer-big-brand, footer-minimal, footer-newsletter, footer-section, integrations-grid, job-detail, legal-layout, location-section, logo-cloud, logo-marquee, logo-stats, menu-section, metrics-band, minimal-hero, navbar, newsletter-section, not-found-section, portfolio-grid, press-quotes, price-list, pricing-section, pricing-single, problem-solution, process-section, product-hero, rating-band, security-section, service-list, signup-hero, split-hero, stats-grid, subpage-header, team-grid, testimonial-grid, testimonial-hero, testimonial-photo, testimonial-spotlight, timeline-section, trial-cta-split, use-cases-grid, video-hero, waitlist-section |
| Models | `@rhs-ui/models/<name>` | 3D model recipes and the viewer: coin-blank, crystal-prism, gem-octa, model-viewer, orbit-ring, pill-capsule, prism-tower, ribbon-knot, ring-torus-duo, satin-pebble, soft-cube, soft-sphere, stacked-rings |
| Backgrounds | `@rhs-ui/backgrounds/<name>` | Living canvas backgrounds: architect-grid, beam-grid, contour-field, diagonal-scan, dot-field, film-grain, fireflies, flow-field, halftone-wave, hex-pulse, moire-rings, orbit-field, particle-network, ping-grid, plus-grid, rain-streaks, ridge-lines, ripple-rings, signal-bars, sketch-lines, starfield-drift |
| Motion | `@rhs-ui/motion/<name>` | Scroll-driven reveals, parallax and reading progress: parallax-layer, reveal, scroll-progress, text-reveal, use-in-view |
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
