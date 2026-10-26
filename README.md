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
| Primitives | `@rhs-ui/primitives/<name>` | The building blocks, one job each: accordion, alert, alert-dialog, anchor-nav, aspect-ratio, async-button, auto-grid, autoplay-toggle, avatar, back-button, back-to-top, badge, banner, bottom-nav, breadcrumb, breadcrumb-collapsed, button, button-group, calendar, callout, card, carousel, check-list, checkbox, checkbox-cards, checkbox-group, chip, code-block, code-tabs, collapsible, color-picker, combobox, command, confirm-popover, context-menu, copy-button, copyable-text, country-label, country-select, currency-input, date-picker, date-range-picker, date-range-text, date-tile, date-time-picker, description-list, dialog, download-button, drawer, dropdown-menu, due-date-label, duration-input, duration-text, empty-search, feature-badge, file-dropzone, file-trigger, floating-action-button, form-field, formatted-number, fullscreen-button, fullscreen-dialog, heading-anchor-link, hold-to-confirm-button, hover-card, icon-button, inline-code, inline-confirm, input, input-group, insert-between-button, kbd, label, labeled-divider, link-card, load-more, loading-dots, marquee, masked-value, match-highlight, media-object, menubar, meter, middle-truncate, mobile-menu, money-amount, month-picker, multi-select, navigation-menu, notification-badge, number-input, opening-hours, otp-input, overflow-actions, page-header, page-size-pagination, pager-nav, pagination, password-input, paste-button, phone-input, popover, print-button, progress, progress-ring, pull-quote, radio-cards, radio-group, range-slider, rating, record-navigator, resend-button, resizable, result-state, review-score, rhs-ui-theme, scroll-area, scroll-tabs, search-input, search-trigger, section-heading, select, separator, settings-row, sheet, shortcut-button, show-more-list, sidebar-nav, skeleton, skip-link, slider, speed-dial, spinner, split-button, status-badge, step-list, stepper, swap-button, switch, switch-group, table, table-of-contents, tabs, tag-input, tag-list, term-tooltip, textarea, textarea-counter, time-picker, toast, toggle, toggle-group, toolbar, tooltip, tree-view, undo-redo-buttons, unit-input, upload-button, vertical-tabs, zoom-controls |
| Icons | `@rhs-ui/icons` | 529 glyphs in one drawing hand, and 457 animated icons at `@rhs-ui/icons/animated/<name>` |
| Commerce | `@rhs-ui/commerce/<name>` | Shop UI: add-stepper, add-to-cart-button, animated-price, bank-transfer-details, base-price, care-instructions, cart-issues, compatibility-check, courier-card, dimension-diagram, fit-scale, grade-scale, installment-line, kitchen-ticket, mini-product-row, modifier-group, order-card, order-edit-window, order-line, order-lookup, order-matrix, pay-button, price-range, product-card, product-info-tabs, product-row-card, product-tile, promo-tile, quantity-calculator, quantity-stepper, rating-inline, refund-tracker, return-window, round-up-toggle, sales-unit-picker, seller-card, shipment-group, shipping-estimator, shoppable-list, view-cart-bar |
| Dashboard | `@rhs-ui/dashboard/<name>` | Dashboards and admin screens: action-tiles, attention-list, balance-card, crosstab-table, dashboard-grid, data-preview-table, facet-filter, field-diff-table, filter-row, greeting-header, metric-definition-popover, metric-strip, monitor-list, next-up-card, on-call-card, queue-summary, raci-matrix, recent-orders-card, target-pace-card, top-movers-list, transaction-list, virtualized-table, weighted-scorecard |
| Application | `@rhs-ui/application/<name>` | Application UI and account screens: accessibility-preferences, add-to-calendar-button, animated-number, appearance-settings, approval-buttons, authenticator-setup, billing-details-section, branding-settings, bulk-select-menu, connected-accounts, copy-as-menu, copy-field, data-export-section, directions-button, early-access-features, email-addresses-section, email-preference-center, empty-state, follow-button, keep-awake-toggle, language-region-section, like-button, listen-button, privacy-settings-section, public-profile-section, recovery-codes-section, save-contact-button, segmented-control, social-sign-in-buttons, transfer-ownership-card, translate-toggle, use-location-button, vote-buttons, watch-button, workspace-profile-section |
| Marketing | `@rhs-ui/marketing/<name>` | Page sections, from the navbar to the footer: about-story, accessibility-statement, allergen-matrix, announcement-bar, app-download-hero, app-hero, article-layout, article-series-outline, awards-row, blog-featured, blog-grid, blog-index-sidebar, blog-list, careers-list, centered-hero, changelog-list, class-timetable, closing-cta, code-of-conduct, collage-hero, contact-cards, contact-section, cookie-banner, cookie-declaration, cta-banner, cta-checklist, cta-image-band, desktop-download-hero, directions-by-mode, docs-page-layout, document-library, download-section, editorial-hero, faq-columns, faq-section, faq-sidebar-categories, faq-tabs, feature-alternating, feature-checklist, feature-grid, feature-icon-row, feature-image-cards, feature-numbers, feature-spotlight, feature-tabs, footer-big-brand, footer-minimal, footer-newsletter, footer-section, founder-letter, help-article-list, how-to-guide, imprint-details, integration-hero, integrations-grid, interview-layout, job-detail, key-dates-list, key-takeaways, leadership-bios, legal-layout, location-section, logo-cloud, logo-marquee, logo-stats, menu-section, metrics-band, minimal-hero, navbar, newsletter-section, not-found-section, open-source-credits, open-source-hero, overlap-cards-hero, pay-bands-table, portfolio-grid, post-feed, press-quotes, press-release-list, price-list, pricing-section, pricing-single, privacy-at-a-glance, problem-solution, process-section, product-hero, prompt-hero, rating-band, release-hero, roadmap-columns, search-results-list, security-section, service-area-list, service-list, signup-hero, sitemap-page, split-hero, stats-grid, subpage-header, subprocessor-list, support-sla-table, team-by-department, team-grid, testimonial-grid, testimonial-hero, testimonial-photo, testimonial-spotlight, three-steps-hero, timeline-section, topic-hub, trial-cta-split, troubleshooting-guide, two-path-hero, use-cases-grid, values-rows, version-support-table, video-hero, video-library, waitlist-section, watch-demo-hero |
| Templates | `@rhs-ui/templates/<name>` | Complete pages: agency-services, architecture-studio, careers, changelog, event-conference, law-firm, newsletter, online-course, podcast, pricing-page, restaurant, studio-portfolio |
| Models | `@rhs-ui/models/<name>` | 3D model recipes and the viewer: apple, basketball, book-stack, brick, coffee-cup, coffee-mug, coin-blank, crystal-prism, cupcake, donut, dumbbell, gem-octa, gold-bar, graduation-cap, hammer, hourglass, house-key, key-ring, light-bulb, model-viewer, orbit-ring, padlock, paint-bucket, paper-plane, parcel-box, pencil, piggy-bank, pill-bottle, pill-capsule, potted-plant, prism-tower, ribbon-knot, ring-torus-duo, satin-pebble, shopping-cart, soft-cube, soft-sphere, stacked-rings, suitcase, tennis-ball, tooth, wallet-leather, wine-glass |
| Backgrounds | `@rhs-ui/backgrounds/<name>` | Living canvas backgrounds: architect-grid, beam-grid, contour-field, diagonal-scan, dot-field, film-grain, fireflies, flow-field, halftone-wave, hex-pulse, moire-rings, orbit-field, particle-network, ping-grid, plus-grid, rain-streaks, ridge-lines, ripple-rings, signal-bars, sketch-lines, starfield-drift |
| Motion | `@rhs-ui/motion/<name>` | Scroll-driven reveals, parallax and reading progress: auto-height, count-up, crossfade, drag-scroll, edge-fade-scroller, fade-in, fill-bar, parallax-layer, reading-time-left, render-on-view, reveal, scroll-aware-header, scroll-away, scroll-focus-list, scroll-progress, smooth-scroll, snap-pages, stagger-list, stick-to-bottom, sticky-section-header, text-reveal, top-loading-bar, use-in-view, view-video |
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
