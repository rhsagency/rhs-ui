# Changelog

All notable changes to the RHS UI registry. Versions are git tags; items carry their
own `meta.version` and are listed when they change.

## Unreleased (0.8.0)

- The whole icon set is free again: the 206 library glyphs (weather, travel, food,
  health, science, home, business, tools, play, animals, music) and the 380 animated
  icons that moved to Pro in 0.7.0 are back under their free names, `Icon<Name>` and
  `Icon<Name>Animated`. That makes 529 glyphs and 457 animated icons, all MIT. RHS UI
  Pro gets an icon family of its own instead, drawn on the 48 grid.
- New in the batch kit (`scripts/batch.mjs`): check new items against the registry
  rules, typecheck them, render their demos on the server and look at them in a
  browser in both themes and on a phone, before they join the registry.
- Eleven new buttons: `button-group`, `split-button`, `icon-button`, `copy-button`,
  `async-button`, `download-button`, `upload-button`, `print-button`, `back-button`,
  `fullscreen-button` and `shortcut-button`, each with a demo.
- Nine new heroes: `open-source-hero`, `watch-demo-hero`, `two-path-hero`,
  `three-steps-hero`, `integration-hero`, `prompt-hero`, `desktop-download-hero`,
  `release-hero` and `overlap-cards-hero`.
- A new category, **dashboard** (19 items): `metric-strip`, `target-pace-card`,
  `attention-list`, `recent-orders-card`, `transaction-list`, `queue-summary`,
  `monitor-list`, `action-tiles`, `balance-card`, `top-movers-list`, `next-up-card`,
  `greeting-header`, `on-call-card`, `facet-filter`, `filter-row`, `dashboard-grid`,
  `metric-definition-popover`, `crosstab-table` and `weighted-scorecard`.
- Application, 22 items: account and workspace settings sections (`email-addresses-section`,
  `public-profile-section`, `appearance-settings`, `accessibility-preferences`,
  `language-region-section`, `privacy-settings-section`, `connected-accounts`,
  `data-export-section`, `billing-details-section`, `email-preference-center`,
  `workspace-profile-section`, `branding-settings`, `authenticator-setup`,
  `recovery-codes-section`, `transfer-ownership-card`, `early-access-features`) and
  actions (`bulk-select-menu`, `copy-as-menu`, `add-to-calendar-button`,
  `directions-button`, `save-contact-button`, `follow-button`).
- Commerce, 20 items: `pay-button`, `product-tile`, `product-row-card`, `mini-product-row`,
  `base-price`, `price-range`, `quantity-stepper`, `add-to-cart-button`,
  `product-info-tabs`, `fit-scale`, `shipping-estimator`, `order-line`, `order-card`,
  `order-lookup`, `modifier-group`, `view-cart-bar`, `promo-tile`, `cart-issues`,
  `rating-inline` and `add-stepper`.
- Marketing, 18 content pages and sections: `blog-index-sidebar`, `post-feed`,
  `docs-page-layout`, `how-to-guide`, `troubleshooting-guide`, `faq-sidebar-categories`,
  `about-story`, `team-by-department`, `leadership-bios`, `search-results-list`,
  `sitemap-page`, `help-article-list`, `imprint-details`, `cookie-declaration`,
  `privacy-at-a-glance`, `key-dates-list`, `support-sla-table` and `code-of-conduct`.
- Motion, 19 items: `top-loading-bar`, `count-up`, `fill-bar`, `fade-in`, `stagger-list`,
  `crossfade`, `auto-height`, `sticky-section-header`, `scroll-focus-list`,
  `edge-fade-scroller`, `drag-scroll`, `scroll-aware-header`, `reading-time-left`,
  `scroll-away`, `render-on-view`, `stick-to-bottom`, `snap-pages`, `view-video` and
  `smooth-scroll`.
- Primitives, 21 items: `undo-redo-buttons`, `zoom-controls`, `record-navigator`,
  `floating-action-button`, `speed-dial`, `overflow-actions`, `hold-to-confirm-button`,
  `resend-button`, `heading-anchor-link`, `paste-button`, `autoplay-toggle`,
  `insert-between-button`, `swap-button`, `status-badge`, `chip`, `tag-list`,
  `formatted-number`, `money-amount`, `link-card`, `due-date-label` and `inline-code`.
- Dashboard, 4 more: `raci-matrix`, `field-diff-table`, `data-preview-table`, `virtualized-table`.
- Commerce, 9 more: `sales-unit-picker`, `quantity-calculator`, `compatibility-check`, `shoppable-list`, `round-up-toggle`, `installment-line`, `return-window`, `order-edit-window`, `courier-card`.
- Fixed: in the `agency-services` and `event-conference` page templates the grid of cards had `overflow-hidden`, which made it the scroll container their reveals follow, so the reveals never ran and two speaker cards stayed half faded. The grid clips with `overflow-clip` now.
- Marketing, 9 more: `press-release-list`, `roadmap-columns`, `pay-bands-table`, `subprocessor-list`, `accessibility-statement`, `document-library`, `video-library`, `class-timetable`, `service-area-list`.
- Primitives, 13 more: `copyable-text`, `middle-truncate`, `match-highlight`, `check-list`, `step-list`, `date-tile`, `date-range-text`, `duration-text`, `masked-value`, `show-more-list`, `country-label`, `code-tabs`, `review-score`.

## Unreleased (0.7.0)

- Free and Pro rebalanced to 40% free and 60% Pro per library. Free keeps the
  foundation: the primitives, the interface icons, the engines, scroll basics and 74
  marketing sections. 189 components and 34 blocks moved to RHS UI Pro: finished
  widgets (players, invoice preview, leaderboard, switchers and more), the application,
  AI, commerce and dashboard components, the account flows and the larger sections.
  Copies you installed before stay yours under MIT.
- Icons: 400 stay free (323 interface glyphs and 77 animated icons for the everyday
  controls); 206 library glyphs and 380 animated icons moved to Pro.
- Backgrounds: 21 stay free on the engine; 18 richer scenes moved to Pro.
- New free: six 3D models (light bulb, key ring, paper plane, hourglass, coffee cup,
  padlock) and twelve page templates (studio portfolio, newsletter, agency services,
  changelog, pricing page, architecture studio, restaurant, event conference, online
  course, law firm, podcast, careers), each built only from free items.
- Twenty-four new free 3D models, each one object: gold bar, piggy bank, leather
  wallet, donut, apple, cupcake, coffee mug, wine glass, dumbbell, tennis ball,
  basketball, brick, hammer, paint bucket, house key, potted plant, pill bottle, tooth,
  pencil, book stack, graduation cap, shopping cart, parcel box and suitcase. Every
  model names its niche in `meta.niche` (finance and crypto, food and drink, fitness,
  trades, home, health, work, retail, travel and more).
- The model viewer frames every model the same way: centred, filling 80% of the frame
  in every orientation, with an orthographic camera, so long and sparse models no
  longer look tiny next to compact ones.


## Unreleased (0.5.0)

- Fifteen primitives: checkbox, radio group, select, combobox, textarea, popover,
  dropdown menu, toast, table, card, avatar, progress, pagination, breadcrumb and
  navigation menu, each with a working demo.
- Six sections: navbar with a phone menu in a sheet, footer, feature grid, testimonial
  grid, sign-in card and account settings. Links take `linkAs` for your router.
- One field surface (`fieldSurface` from input) for Input, Textarea and the Select and
  Combobox triggers, and one panel surface (`panelSurface` from popover) for every
  floating layer. A choice list is never the browser's native menu.
- Every item names its family in `categories[1]` (forms, overlay, navigation, feedback,
  page chrome, account and more); rhsui.com groups the library by it.
- Fixed: Skeleton's `delay` now offsets the shimmer; the variable was set but never read.
- Fixed: Tabs show their look again. The triggers styled themselves from a `group/list`
  the list never declared, so neither `line` nor `pill` applied. The registry gate now
  refuses a named `group-*/name` or `peer-*/name` variant that no element declares.
- Fixed: CommandDialog wraps its children in a Command root, so a palette opens instead
  of throwing. Put CommandInput and CommandList straight inside. New command demo.
- Fixed: CommandEmpty waits until mount. cmdk counts items as they register, so every
  server-rendered list flashed "nothing matches" before its items appeared.
- New category `motion`, family "Scroll & reveal": `reveal` (rise, tilt, scale, blur or
  slide into place), `parallax-layer`, `scroll-progress` and `text-reveal`. Pure CSS
  scroll-driven animations: nothing is hidden before hydration, and reduced motion or a
  browser without scroll timelines shows everything at rest.
- Five new backgrounds: flow field, particle network, beam grid, signal bars and warp
  field. The canvas engine takes your own painter (`paint`) and, with `interactive`,
  the pointer and the scroll position. The four existing patterns work as before.
- Backgrounds carry a `tagline` and `use` in `meta`, so a gallery can be built from the
  registry alone.
- Thirty more backgrounds (39 in all), each with a `mood` (calm, technical, cosmic,
  organic, data) for filtering.
- Thirty-five more components: alert, alert dialog, hover card, context menu, menubar,
  collapsible, toggle, toggle group, scroll area, aspect ratio, spinner; input group,
  search input, password input, number input, OTP input, tag input, form field, rating,
  colour picker, calendar, date picker, file dropzone; data table, stepper, tree view,
  carousel, marquee, description list, banner, resizable, sidebar nav, code block,
  progress ring and meter. Each has a demo.
- Eight charts in `dashboard`: line, area, bar, donut, sparkline, activity heatmap, gauge
  and funnel. Formatting is `Intl.NumberFormatOptions`, so a Server Component can pass it,
  and every chart carries its numbers as a table or in words for screen readers.
- Five application components for AI and team products: prompt input, chat thread,
  notification list, comment thread and status dot.
- Eight commerce components: cart line, coupon field, order summary, shipping options,
  shipping progress, rating summary, product gallery and variant selector. Money is
  `{ amount, currency }` in minor units, formatted by the shared `money.ts`.
- 195 more glyphs (374 in all) in the same hand, with five new groups: weather and
  nature, travel and places, health and sport, learning and work, shapes and layout.
- 338 more animated icons (365 in all). Each is cut from its still glyph, so it is drawn
  exactly like it, and moves with one of a small set of motions (nudge, draw, swing,
  pop, spin, grow and more) on hover, focus, loop or first view; reduced motion keeps
  the still glyph. Generated from `scripts/icons/animated-icons.mjs`
  (`pnpm icons:generate`); `pnpm check` fails when a generated file is stale.
- Fixed: PricingSection lays out one column per plan up to four. Three plans used to wrap
  into two columns with the third card alone on a second row.
- Every animated icon names its still glyph and a usage snippet in `meta`, and the
  registry gate checks both, so a gallery can be built from the registry alone.
- Fixed: the navbar block no longer holds state, so a Server Component can pass its
  router's Link as `linkAs`; each phone link closes the sheet itself.
- Gates: `check:registry` refuses a Tailwind variant built in a template string, an Intl
  formatter or `toLocaleString` without a locale, and a `"use client"` module that takes a
  component as a prop.
- Gates: every demo is rendered on the server in CI (`pnpm test:render`), a native
  select may only be the hidden form mirror, the registry gate refuses an item without
  a family, and the README table is generated from the registry.
- Four animated canvas backgrounds: dot field, contour field, orbit field and architect grid. Shared engine pauses offscreen, in hidden tabs and with reduced motion.
- Six marketing blocks: split hero, feature spotlight, process, FAQ, animated metrics and closing CTA.
- Four application components: segmented control, copy field, before/after comparison and activity timeline.
- Model recipes can set the torus tube radius for finer spatial compositions.
- Every new public item includes a working registry demo.

## Previous additions (0.2.0)

### Changed (breaking)

- One structure for everything: an item's category is its folder in the repository,
  its folder in your project and the first part of its import path.

  | Before | Now |
  | --- | --- |
  | `@rhs-ui/ui/button` | `@rhs-ui/primitives/button` (all primitives) |
  | `@rhs-ui/ui/icons` | `@rhs-ui/icons` |
  | `@rhs-ui/components/product-card/product-card` | `@rhs-ui/commerce/product-card` |
  | `@rhs-ui/components/empty-state` | `@rhs-ui/application/empty-state` |
  | `@rhs-ui/blocks/preferences-panel` | `@rhs-ui/application/preferences-panel` |
  | `@rhs-ui/blocks/pricing-section` | `@rhs-ui/marketing/pricing-section` |

- Everything installs under `components/rhs-ui/<category>/`. One tsconfig alias,
  `"@rhs-ui/*": ["./src/components/rhs-ui/*"]`, replaces the three before it.
- Categories renamed: `core` is now `primitives`, and icons have their own `icons`
  category.

### Added

- Icons: 152 new glyphs, 179 in total, in the same drawing hand, and `Glyph`, the frame
  to draw your own. The new ones cover application UI (table, board, grip, archive,
  history, zoom), people and security (user-plus, user-check, fingerprint,
  shield-alert, building), devices (wifi, battery, power), code (server, git-branch,
  bug, braces, gauge), files (file-plus, file-check, folder-open, clipboard, save,
  printer), commerce (wallet, receipt, store, barcode, ticket, gift, banknote) and a
  text and editing group.
- Animated icons, one item each on the shared `animated-icon` engine, 27 in total.
  Motion on a trigger: bell, search, arrow-right, heart, sparkle, refresh, download,
  trash, send, cart, check-circle, settings, mail, upload, star, log-out, phone, clock
  and message. Two states with `active`: copy, menu, sun-moon, lock, eye, play-pause,
  plus and bookmark. No animation library; reduced motion is respected.
- Registry gate: items must sit in the folder of their category and install to the
  mirrored path, every file that calls a hook must be a client module, every item is
  `meta.tier: "free"` (this registry is the free tier) and an animated icon moves on a
  `trigger` or switches between two states.

## 0.1.0

### Added

- Primitives: `icons`, `button`, `badge`, `skeleton`, `separator`, `kbd`, `input`,
  `label`, `tooltip`, `dialog`, `sheet`, `tabs`, `command`
- Commerce: `product-card`
- Theme: `rhs-ui-theme`
- Registry build, registry gate with self-test, install test against Base UI and
  Radix scratch projects
