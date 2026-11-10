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
| Primitives | `@rhs-ui/primitives/<name>` | The building blocks, one job each: accordion, activity-toast, alert, alert-dialog, aligned-card-grid, allocation-slider, amount-presets, anchor-nav, angle-field, aspect-ratio, aspect-ratio-picker, async-button, async-select, async-switch, async-view, audio-waveform, auto-grid, autoplay-toggle, autosuggest-field, avatar, back-button, back-to-top, badge, banner, barcode, barcode-field, bento-layout, birthday-field, bottom-nav, box-sides-field, breadcrumb, breadcrumb-collapsed, browser-frame, bulk-paste-field, button, button-group, calendar, callout, card, carousel, cascade-select, check-list, checkbox, checkbox-cards, checkbox-group, chip, chip-select, choice-list, chrome-offsets, code-block, code-field, code-tabs, collapsible, collapsible-panes, collapsing-columns, color-area-picker, color-picker, combobox, command, confirm-popover, container, context-menu, contrast-pair-field, copy-button, copyable-text, country-label, country-select, creatable-select, cron-field, currency-exchange-field, currency-input, date-field, date-picker, date-range-picker, date-range-text, date-tile, date-time-picker, description-list, dialog, dimensions-field, disabled-reason, dismissible-notice, download-button, drawer, dropdown-menu, due-date-field, due-date-label, duration-input, duration-text, email-field, embed-consent, emoji-scale, empty-search, error-boundary, estimated-progress, eta-progress, expiry-select, feature-badge, file-dropzone, file-trigger, file-type-icon, filename-field, floating-action-button, floating-stack, font-family-select, font-size-field, form-field, form-grid, formatted-number, full-bleed-band, fullscreen-button, fullscreen-dialog, hairline-grid, heading-anchor-link, height-field, histogram-slider, hold-to-confirm-button, holy-grail-layout, hotspot-image, hover-card, hover-video-preview, icon-button, icon-picker, image-picker, image-sequence, image-tile, image-url-field, infinite-scroll-status, inline-code, inline-confirm, inline-field, inline-list, input, input-group, insert-between-button, inset-panel, justified-gallery, kbd, label, labeled-divider, language-select, laptop-frame, last-updated, leader-list, likert-scale, limit-field, link-card, link-field, listbox, live-announcer, load-more, loading-dots, loading-overlay, markdown-field, marquee, masked-input, masked-value, match-highlight, media-card, media-object, menubar, meter, middle-truncate, milestone-progress, mobile-menu, money-amount, month-picker, multi-currency-field, multi-date-picker, multi-select, name-field, national-id-field, natural-date-field, navigation-menu, new-items-pill, notification-badge, number-input, number-range-field, opening-hours, optimistic-item, otp-input, overflow-actions, page-header, page-size-pagination, pager-nav, pagination, password-generator, password-input, paste-button, pattern-cover, pausable-image, percentage-field, phone-frame, phone-input, photo-mosaic, photo-stack, play-clip-button, popover, position-picker, postal-code-field, preview-picker, print-button, progress, progress-ring, progressive-image, pull-quote, pull-to-refresh, qr-code, quick-phrases-field, radio-cards, radio-group, radio-table, range-slider, rank-list, rating, rating-breakdown-field, reading-column, recent-searches-field, recipient-field, record-navigator, repeat-select, resend-button, resizable, result-state, review-score, rhs-ui-theme, scoped-search-field, screen-frame, scroll-area, scroll-tabs, search-input, search-trigger, section-heading, section-shell, seek-bar, select, separator, settings-row, sheet, shortcut-button, shortcut-recorder, shorthand-number-field, show-more-list, sidebar-layout, sidebar-nav, skeleton, skeleton-group, skip-link, slider, slider-field, slow-loading-state, slug-field, sms-message-field, speed-dial, spinner, split-button, split-screen, status-badge, status-bar, step-list, step-slider, stepper, story-ring, strength-meter, swap-button, switch, switch-group, table, table-of-contents, tabs, tag-input, tag-list, task-toast, term-tooltip, text-skeleton, textarea, textarea-counter, threshold-slider, thumbnail-strip, time-estimate-field, time-field, time-picker, time-range-field, toast, toggle, toggle-group, toolbar, tooltip, tree-view, undo-redo-buttons, undo-toast, unit-input, update-highlight, upload-button, url-field, username-field, variable-textarea, vertical-tabs, video-facade, volume-control, week-picker, weekday-picker, wheel-picker, zoom-controls, zoomable-image |
| Icons | `@rhs-ui/icons` | 529 glyphs in one drawing hand, and 457 animated icons at `@rhs-ui/icons/animated/<name>` |
| Commerce | `@rhs-ui/commerce/<name>` | Shop UI: add-stepper, add-to-cart-button, address-confirm-dialog, age-verification-gate, animated-price, bank-transfer-details, base-price, bill-splitter, booking-summary, brand-index, card-fieldset, care-instructions, cart-issues, category-nav, category-product-rows, checkout-sign-in-choice, compatibility-check, coupon-card, courier-card, course-card, customer-account-home, delivery-instructions, dimension-diagram, discount-field, fit-scale, flight-card, grade-scale, installment-line, kitchen-ticket, line-items-table, mini-product-row, modifier-group, offer-list, order-card, order-edit-window, order-help-options, order-line, order-lookup, order-matrix, pay-button, payment-card-preview, payment-plan-picker, pickup-ready-card, plan-card, price-breakdown-popover, price-matrix, price-quote-card, price-range, price-transparency, product-card, product-info-tabs, product-passport, product-pricing-fieldset, product-row-card, product-safety-info, product-tile, promo-tile, quantity-calculator, quantity-stepper, radio-accordion, ranked-product-list, rating-filter, rating-inline, refund-tracker, region-switcher, rental-rates, reorder-list, return-window, returns-policy-section, reviews-to-write, room-card, round-up-toggle, sales-unit-picker, sample-request, search-results-header, seller-card, shelf-label, shipment-group, shipping-estimator, shipping-rates-table, shoppable-list, stock-adjust-field, trade-account-application, trade-credit-summary, vat-price-field, view-cart-bar, warranty-registration |
| Dashboard | `@rhs-ui/dashboard/<name>` | Dashboards and admin screens: action-tiles, attention-list, balance-card, crosstab-table, dashboard-grid, data-preview-table, facet-filter, field-diff-table, filter-row, greeting-header, metric-definition-popover, metric-strip, monitor-list, next-up-card, on-call-card, queue-summary, raci-matrix, recent-orders-card, target-pace-card, top-movers-list, transaction-list, virtualized-table, weighted-scorecard |
| Application | `@rhs-ui/application/<name>` | Application UI and account screens: accessibility-preferences, account-chooser, achievement-tile, activity-entry, add-to-calendar-button, agreement-scroll, amenity-list, animated-number, answer-checklist, answers-review, api-endpoint, app-listing-card, appearance-settings, appointment-card, approval-buttons, article-card, attendee-list, authenticator-setup, authorize-app-card, availability-calendar, batch-progress, billing-details-section, book-card, branding-settings, bulk-result-summary, bulk-select-menu, call-log-row, certificate-card, chat-header, checklist-card, class-session-card, color-token-card, coming-soon-state, comment-composer, comment-item, commit-list, company-card, conditional-fields, connected-accounts, contact-fieldset, copy-as-menu, copy-field, curriculum-list, danger-zone, dashboard-shell, data-export-section, delivery-stop-card, device-code-entry, directions-button, document-upload-row, draft-restored-notice, drop-overlay, early-access-features, editable-section, email-addresses-section, email-preference-center, empty-state, event-chip, event-time-fieldset, expandable-text, experience-list, feature-gate, feed-shell, field-repeater, filter-rail-shell, first-run-state, focal-point-field, focus-shell, follow-button, form-actions, form-dialog, form-outline, form-section, form-tabs, fundraiser-card, guest-picker, help-launcher, image-alt-field, image-cropper, image-upload-grid, inbox-row, ingredient-list, inherited-field, inset-sidebar-shell, inspector-shell, integration-card, invitation-card, invite-accept-card, job-card, keep-awake-toggle, language-region-section, like-button, likert-matrix, listen-button, magic-link-sign-in, map-panel-shell, match-score-card, match-timeline, member-row, membership-card, message-bubble, mobile-tab-shell, mode-bar, needs-setup-state, note-card, notice-stack, notification-item, offline-state, passkey-sign-in, payment-failed-banner, permission-primer, phone-sign-in, pin-lock-screen, player-card, priority-indicator, privacy-settings-section, project-card, property-card, public-profile-section, pwa-install-prompt, queue-position, quiet-hours-field, rail-panel-shell, reaction-bar, reauthenticate-card, recipe-card, record-lookup, record-page-shell, recovery-codes-section, relative-time, reply-summary, repo-card, report-form, save-contact-button, season-strip, section-sidebar-shell, segmented-control, send-schedule-field, seo-fieldset, service-card, set-new-password, settings-shell, sla-timer, social-links-fieldset, social-sign-in-buttons, specialist-card, sso-sign-in, stack-trace, stamp-card, status-message-field, status-select, streak-tracker, summary-aside-shell, suspicious-activity-alert, task-card, task-relations, task-row, team-clocks, terms-update-gate, testimonial-card, tiered-rates-editor, time-tracker, top-nav-shell, tour-card, transfer-list, transfer-ownership-card, translatable-field, translate-toggle, trial-status-bar, two-column-sign-in, typing-indicator, unavailable-state, unsupported-browser-notice, update-available-bar, use-location-button, utm-builder, vehicle-card, venue-card, verification-method-picker, verify-email-banner, verify-email-card, vote-buttons, watch-button, week-strip, wizard-shell, workbench-shell, workspace-profile-section, workspace-url-sign-in |
| Marketing | `@rhs-ui/marketing/<name>` | Page sections, from the navbar to the footer: about-story, accessibility-statement, advisor-hero, affiliate-offer, allergen-matrix, announcement-bar, api-endpoints, api-request-hero, app-download-hero, app-download-qr, app-hero, app-screens-row, appointment-hero, article-footnotes, article-layout, article-series-outline, audience-discounts, automation-recipes, awards-row, big-number-hero, blog-featured, blog-grid, blog-index-sidebar, blog-list, book-hero, booking-bar, breadcrumb-bar, breathing-hero, call-us-section, capability-questions, careers-list, centered-hero, certifications-explained, changelog-list, class-timetable, closing-cta, code-of-conduct, cohort-signup, collage-hero, collection-hero, commitments-progress, community-hero, contact-cards, contact-faq-split, contact-form-centered, contact-form-routed, contact-section, cookie-banner, cookie-declaration, course-enroll-hero, coverage-check, creator-hero, credit-packs, cta-banner, cta-checklist, cta-giant-link, cta-image-band, cta-photo-split, dashboard-hero, deployment-options, desktop-download-hero, directions-by-mode, docs-header, docs-page-layout, document-library, donation-hero, download-section, early-access-form, editorial-hero, email-course-signup, enterprise-plan-band, extension-points, faq-columns, faq-section, faq-sidebar-categories, faq-tabs, feature-alternating, feature-carousel, feature-checklist, feature-filter-grid, feature-grid, feature-icon-row, feature-image-cards, feature-numbers, feature-outcomes, feature-spotlight, feature-tabs, feature-with-quote, footer-app-stores, footer-big-brand, footer-folding-columns, footer-link-rows, footer-local-business, footer-minimal, footer-newsletter, footer-region-selector, footer-section, founder-letter, free-audit-form, gallery-hero, good-fit-section, guarantee-panel, help-article-list, how-to-guide, import-sources, imprint-details, incident-postmortem, industry-index, inline-image-hero, integration-hero, integrations-grid, interview-layout, job-detail, join-count-cta, key-dates-list, key-takeaways, keyboard-features, leadership-bios, legal-layout, limited-offer-panel, lineup-hero, local-business-hero, locale-demo, locale-suggestion-bar, location-section, logo-cloud, logo-marquee, logo-stats, marketplace-hero, matchday-hero, materials-section, membership-tiers, menu-section, metrics-band, minimal-hero, mobile-nav-drilldown, model-lineup, name-your-price, navbar, navbar-centered-logo, navbar-onepage, navbar-transparent, navbar-two-row, navbar-with-search, newsletter-card, newsletter-lists, newsletter-preview, newsletter-section, not-found-section, office-list, open-source-credits, open-source-hero, overlap-cards-hero, pay-bands-table, paywall-gate, pillars-section, platform-availability, podcast-hero, portfolio-grid, post-feed, press-quotes, press-release-list, price-list, pricing-rows, pricing-section, pricing-single, privacy-at-a-glance, problem-solution, process-section, product-hero, project-capacity, promo-code-cta, promo-slider-hero, prompt-examples, prompt-hero, property-search-hero, quickstart-steps, rate-card, rating-band, recipe-hero, recipe-layout, refer-a-friend, region-list, release-hero, reservation-hero, roadmap-columns, rollout-plan, rsvp-form, savings-receipt, screenshot-features, sdk-grid, search-results-list, security-section, service-area-list, service-levels, service-list, service-packages, service-start-hero, signup-hero, sitemap-page, smart-app-banner, spend-breakdown, split-hero, stack-layers, stats-grid, sticky-cta-bar, subpage-header, subprocessor-list, support-sla-table, sync-mapping, talk-to-us-cta, team-by-department, team-grid, testimonial-grid, testimonial-hero, testimonial-photo, testimonial-spotlight, thank-you-next-steps, theme-preview, three-steps-hero, ticket-tiers, timeline-section, timetable-hero, topic-hub, tour-chapters, trial-cta-split, trial-timeline, troubleshooting-guide, trust-documents, trusted-by-hero, two-path-hero, two-sided-features, ui-snippets-hero, upgrade-prompt, use-cases-grid, utility-bar, values-rows, version-support-table, video-hero, video-library, waitlist-section, watch-demo-hero, webinar-signup, welcome-offer-signup, which-one-guide |
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
