# Changelog

All notable changes to the RHS UI registry. Versions are git tags; items carry their
own `meta.version` and are listed when they change.

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
