# Changelog

All notable changes to the RHS UI registry. Versions are git tags; items carry their
own `meta.version` and are listed when they change.

## Unreleased (0.2.0)

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
