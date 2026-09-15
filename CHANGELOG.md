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

- Icons: 88 new glyphs, 115 in total, in the same drawing hand, and `Glyph`, the frame
  to draw your own.
- Animated icons, one item each on the shared `animated-icon` engine: bell, search,
  arrow-right, heart, sparkle, refresh, download, trash, send, cart and check-circle
  move on hover, focus, loop or first view; copy, menu and sun-moon switch between two
  states with `active`. No animation library; reduced motion is respected.
- Registry gate: items must sit in the folder of their category and install to the
  mirrored path, and every file that calls a hook must be a client module.

## 0.1.0

### Added

- Primitives: `icons`, `button`, `badge`, `skeleton`, `separator`, `kbd`, `input`,
  `label`, `tooltip`, `dialog`, `sheet`, `tabs`, `command`
- Commerce: `product-card`
- Theme: `rhs-ui-theme`
- Registry build, registry gate with self-test, install test against Base UI and
  Radix scratch projects
