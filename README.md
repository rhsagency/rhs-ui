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
| Primitives | `@rhs-ui/primitives/<name>` | The building blocks, one job each: accordion, address-fields, alert, alert-dialog, anchor-nav, app-switcher, aspect-ratio, audio-player, avatar, avatar-upload, back-to-top, badge, banner, bottom-nav, breadcrumb, breadcrumb-collapsed, button, calendar, callout, card, carousel, checkbox, checkbox-group, coachmark, code-block, code-diff, collapsible, collapsible-sidebar, color-picker, combobox, command, confirm-popover, connection-status, contact-card, context-menu, country-select, currency-input, date-picker, date-range-picker, date-time-picker, description-list, dialog, drawer, dropdown-menu, event-card, feature-badge, file-dropzone, floating-action-bar, form-field, hover-card, iban-field, image-grid, input, input-group, invoice-preview, json-viewer, kbd, label, labeled-divider, leaderboard, load-more, loading-dots, maintenance-banner, marquee, masonry-grid, media-object, mention-textarea, menubar, meter, mobile-menu, month-picker, multi-select, navigation-menu, notification-badge, nps-scale, number-input, offline-banner, otp-input, page-header, pager-nav, pagination, password-input, phone-input, popover, profile-card, progress, progress-ring, pull-quote, quick-links, radio-cards, radio-group, range-slider, rating, resizable, result-state, rhs-ui-theme, scroll-area, scroll-tabs, search-input, section-heading, select, separator, settings-row, share-dialog, sheet, shortcut-dialog, sidebar-nav, signature-pad, skeleton, skeleton-presets, skip-link, slider, spec-table, spinner, stepper, switch, switch-group, table, table-of-contents, tabs, tag-input, textarea, textarea-counter, ticket-stub, time-picker, timezone-select, toast, toggle, toggle-group, toolbar, tooltip, tree-table, tree-view, unsaved-changes-bar, upload-progress, user-chip, video-player, workspace-switcher |
| Icons | `@rhs-ui/icons` | 466 glyphs in one drawing hand, and 457 animated icons at `@rhs-ui/icons/animated/<name>` |
| Commerce | `@rhs-ui/commerce/<name>` | Shop UI: animated-price, cart-line, compare-tray, coupon-field, delivery-estimate, gift-card-balance, mini-cart, order-receipt, order-summary, payment-methods, price-tag, product-badges, product-card, product-gallery, quick-view, rating-summary, recently-viewed, review-card, shipping-options, shipping-progress, size-guide, stock-indicator, store-locator, subscribe-save, variant-selector, wishlist-button |
| Dashboard | `@rhs-ui/dashboard/<name>` | Dashboards and admin screens: activity-heatmap, area-chart, bar-chart, bullet-chart, donut-chart, funnel-chart, gauge, goal-ring, histogram-chart, kpi-card, line-chart, metric-comparison, progress-list, radar-chart, scatter-chart, sparkline, stacked-bar, stat-trend, treemap-chart, uptime-bars, waterfall-chart |
| Application | `@rhs-ui/application/<name>` | Application UI and account screens: account-settings, activity-timeline, agenda-list, ai-artifact-card, ai-chat-launcher, ai-context-meter, ai-feedback, ai-message, ai-model-picker, ai-prompt-library, ai-reasoning, ai-rewrite-menu, ai-sources, ai-suggestions, ai-tool-call, ai-voice-input, animated-number, api-key-field, billing-section, chat-thread, comment-thread, comparison-slider, copy-field, countdown-timer, data-table, empty-state, file-list, filter-bar, forgot-password-card, inline-edit, invite-members, kanban-board, notification-list, onboarding-checklist, onboarding-welcome, plan-usage, preferences-panel, prompt-input, segmented-control, shortcut-list, sign-in-card, sign-up-card, status-dot, step-progress, two-factor-card |
| Marketing | `@rhs-ui/marketing/<name>` | Page sections, from the navbar to the footer: announcement-bar, api-code-section, app-download-hero, app-hero, article-layout, author-bio, avatar-proof, awards-row, bento-grid, blog-featured, blog-grid, blog-list, booking-section, careers-list, case-study-cards, centered-hero, changelog-list, closing-cta, comparison-section, contact-cards, contact-section, cookie-banner, cta-banner, cta-checklist, customer-story, demo-hero, download-section, editorial-hero, event-hero, events-list, faq-columns, faq-section, feature-accordion-media, feature-alternating, feature-checklist, feature-grid, feature-icon-row, feature-spotlight, feature-tabs, footer-big-brand, footer-minimal, footer-newsletter, footer-section, glossary-section, integrations-grid, language-switcher, lead-magnet, legal-layout, logo-cloud, logo-marquee, metrics-band, metrics-hero, navbar, newsletter-section, not-found-section, platform-hub, podcast-episodes, press-kit, press-quotes, pricing-section, pricing-single, pricing-table, process-section, product-hero, rating-band, resource-library, search-hero, security-section, signup-hero, split-hero, stats-grid, subpage-header, team-grid, testimonial-grid, testimonial-spotlight, testimonial-wall, timeline-section, trial-cta-split, use-cases-grid, video-hero, waitlist-section |
| Models | `@rhs-ui/models/<name>` | 3D model recipes and the viewer: coin-blank, crystal-prism, gem-octa, model-viewer, orbit-ring, pill-capsule, prism-tower, ribbon-knot, ring-torus-duo, satin-pebble, soft-cube, soft-sphere, stacked-rings |
| Backgrounds | `@rhs-ui/backgrounds/<name>` | Living canvas backgrounds: architect-grid, ascii-field, beam-grid, circuit-trace, contour-field, depth-tunnel, diagonal-scan, dot-field, double-helix, film-grain, fireflies, flow-field, glyph-rain, halftone-wave, hex-pulse, isometric-blocks, light-curtain, lissajous, live-chart, moire-rings, orbit-field, oscilloscope, particle-network, ping-grid, plus-grid, polygon-bloom, radar-sweep, rain-streaks, ribbon-flow, ridge-lines, ripple-rings, rising-bubbles, signal-bars, sketch-lines, spiral-arms, starfield-drift, sunflower, warp-field, wave-mesh |
| Motion | `@rhs-ui/motion/<name>` | Scroll-driven reveals, parallax and reading progress: border-beam, dock, flip-card, highlight-text, hover-preview-list, magnetic, orbit-items, parallax-layer, reveal, scramble-text, scroll-progress, shimmer-text, split-text, spotlight-card, text-reveal, tilt-card, typewriter-text, underline-link, use-in-view, word-rotate |
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
