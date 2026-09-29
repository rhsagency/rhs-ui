# Changelog

All notable changes to the RHS UI registry. Versions are git tags; items carry their
own `meta.version` and are listed when they change.

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
