# Changelog

All notable changes to the RHS UI registry. Versions are git tags; items carry their
own `meta.version` and are listed when they change.

## Unreleased (0.8.0)

- `timesheet-grid` writes the week it shows the same on the server and in the
  browser: "19 – 25 Oct 2026". The dash between two days came out with spaces
  in one engine and without in another (Node 22 against Chrome), so a page
  rendered on the server failed to hydrate.
- `reveal` and `text-reveal` keep their words readable at every scroll position.
  Both run on the scroll itself, so wherever someone stops scrolling is what they
  read. `reveal` now moves the element in (rise, tilt, scale, slide) at full
  opacity and sharp: a card that stopped low on the screen stood half clear, at
  1.45 to 4.36:1 for its text. A new `fade` prop brings the fade, and for `blur`
  the blur, back for an image or a decoration without words. `text-reveal` dims
  a waiting word to 0.5 instead of 0.18, which keeps the 3:1 of large text: 3.6:1
  on a light page and 5.2:1 on a dark one, where 0.18 was 1.5:1 on white.
  `scroll-away` clears its content away from below with a clip instead of a fade,
  so the lines still in view stay sharp at full contrast (its fade left them at
  1.77:1 half way); every effect still ends gone. Its `blur` is for an element
  without words.
- `carousel`'s track takes focus (with a ring), so a keyboard scrolls it with the
  arrow keys when no slide holds a link or a button. `call-log-row`'s voicemail
  button is named by what it shows, "Voicemail 0:42", with who and how long read
  after it: its label left the shown time out (WCAG 2.5.3). `playVoicemail` is
  now the words after it, default "play, from {name}, {duration}".
- Seventeen controls are named by what they show, so a voice user can say what
  they see (WCAG 2.5.3, axe label-content-name-mismatch on every rhsui.com page
  that showed them): `follow-button`, `like-button`, `social-sign-in-buttons`,
  `event-chip`, `weekday-picker`, `chat-header`, `reply-summary`, `facet-filter`,
  `first-run-state`, `app-listing-card`, `price-breakdown-popover`, `phone-input`,
  `resend-button`, `recipient-field`, `multi-currency-field`,
  `currency-exchange-field` and `bulk-paste-field`. A name now starts with the
  shown words in their order ("16:00 Dentist", "EUR, Euro", "1.2K likes", "Mon,
  Monday"); words that ran together for lack of a space ("09:00Standup") are
  apart; and a logo's letters, an avatar's initials, a countdown and a word that
  only shows on hover are drawn by CSS, so they never join a control's words.
  `follow-button` is a plain button now, since its label changes with its state;
  `reply-summary`'s `lastReplyName` is no longer read.
- Contrast and keyboard reach, from the same sweep. `badge` (destructive) and
  `alert` (destructive) darken their red words toward the text colour, so they
  reach 4.5:1 on the red tint (3.88 and 4.32:1 before). Nine fields that dim
  themselves when disabled (`dimensions-field`, `height-field`,
  `shorthand-number-field`, `percentage-field`, `due-date-field`,
  `natural-date-field`, `time-estimate-field`, `currency-exchange-field`,
  `async-switch`) say so on their root (`role="group"` with `aria-disabled`):
  text of an inactive control is exempt from contrast, and now a screen reader
  and axe know it is inactive. A disabled `wheel-picker` holds still instead of
  scrolling where no keyboard can reach. `command`'s separator is presentational
  (`role="none"`), since a listbox may hold only options and groups.
  `creatable-select` says "Required" in its description instead of
  `aria-required`, which a button cannot take (new `required` message). The
  demos of `reveal`, `parallax-layer`, `scroll-progress` and `text-reveal`
  scroll in a panel that takes focus.
- Every demo now passes axe's label, ARIA and keyboard rules (984 of 984,
  server-rendered). `avatar`'s fallback draws initials given as a string with
  CSS, so an avatar's letters never join the words of the control around it
  ("MO" in an account button); anything else you pass renders as before.
  `video-facade`, `call-us-section`, `transfer-ownership-card` and the
  `map-panel-shell` demo keep their parts apart with spaces and are named in the
  order they show. `magic-link-sign-in` and `phone-sign-in` draw their resend
  countdown with CSS while the name stays the resend words. `combobox` says
  "Required" in its description instead of `aria-required` (new
  `requiredLabel`), and `phone-frame`'s screen takes focus when it scrolls.
- Contrast in the demos rhsui.com shows in a frame, which the page sweep had not
  reached; the registry's own check now measures every demo for contrast too, in
  light and dark (1011 of 1011). `logo-cloud` and `logo-marquee` set a name in
  the text colour at 60% instead of 55%, so it reads at 5:1 (4.2:1 before; a mark
  you pass stays as it is). `radio-table` says a row is off on the row itself
  (`aria-disabled`), so its dimmed figures count as an inactive control's. A
  `thumbnail-strip` preview that is not the chosen one dims its picture, not its
  badges, so a video's length reads on every preview (3.6:1 before).
- Structure a screen reader relies on, from the same frames, now that the
  registry's check runs every WCAG 2.1 A and AA rule axe has instead of eight:
  `price-list` keeps each group of its definition list to a term and its
  descriptions (the dotted leader is the term's own `::after`, a note is a second
  `dd`), `menu-section` puts its list inside the tab panel instead of making the
  list the panel, so the dishes are list items again, and the `event-conference`
  template gives its programme tabs plain values (`day-1`), since a value with
  spaces became an id and an `aria-controls` that pointed at nothing. Both
  blocks to 0.8.0.
- `match-highlight` sets a match in the text colour, whatever the line around it
  has: quiet text on the mark's own tint was 4.0:1 (found through Pro's
  `address-lookup`, which uses it). `adaptive-nav`'s page area, which scrolls on
  its own, is a named region that takes focus (new `content` label, "Page
  content"), so a keyboard can scroll it.
- On a phone, from the registry's check measuring every demo at 390 px too:
  `table`'s container, which scrolls sideways when the table is wider than the
  screen, takes focus (with a ring), so a keyboard scrolls it; so do
  `awards-row`'s sideways row and `inset-panel`'s inset (pass `tabIndex` to
  take that stop away where you know nothing scrolls). `photo-mosaic`'s
  show-all buttons say their count after a comma instead of in brackets, which
  a voice matcher leaves out. `table` and `awards-row` to 0.8.0.
- From a sweep of every rhsui.com page on a screen and a phone, and the
  registry's check at 320 px. `embed-consent`'s example draws each embed as a
  whole document with its own title and language, as a provider's page has,
  and its calendar's weekday labels read at 5.3:1 (3.3:1 before).
  `docs-page-layout`'s example gives its table `tabIndex={0}`, as the layout's
  notes ask, and `inset-panel`'s example its code block: in a narrow frame both
  scroll on their own, and a keyboard could not reach them. `workbench-shell`'s
  status bar is a tab stop until the browser has measured it, so a strip that
  is cut off can be reached without script; once it fits, it gives the stop
  back. The registry's check now measures the frames a demo draws itself, in
  rhsui.com's own fonts, with the preview's padding, and at 320 px (the reflow
  width of WCAG 1.4.10) as well.
- A component index for tools: `/r/component-index.json` lists every free item with
  its kind, import path, exported components and their props, a usage example and
  what it depends on, plus the theme tokens. Read it instead of the source; a
  release never drops an item, an import path, an export or a theme variable
  without a breaking version.
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
- Commerce, 9 more: `kitchen-ticket`, `bank-transfer-details`, `seller-card`, `care-instructions`, `grade-scale`, `order-matrix`, `shipment-group`, `dimension-diagram`, `refund-tracker`.
- Marketing, 10 more: `directions-by-mode`, `allergen-matrix`, `founder-letter`, `values-rows`, `topic-hub`, `key-takeaways`, `article-series-outline`, `interview-layout`, `version-support-table`, `open-source-credits`.
- Application, 9 more: `like-button`, `vote-buttons`, `watch-button`, `approval-buttons`, `social-sign-in-buttons`, `translate-toggle`, `use-location-button`, `keep-awake-toggle`, `listen-button`.
- Application, 9 more: `reaction-bar`, `inset-sidebar-shell`, `top-nav-shell`, `settings-shell`, `filter-rail-shell`, `wizard-shell`, `dashboard-shell`, `focus-shell`, `mobile-tab-shell`.
- Fixed: `model-viewer` decodes an inline GLB itself instead of fetching its data: URL, so the free models also appear on a site whose Content-Security-Policy keeps connect-src to its own origin (rhsui.com was such a site: Explore in 3D did nothing).
- Commerce, 9 more: `bill-splitter`, `rental-rates`, `shelf-label`, `search-results-header`, `checkout-sign-in-choice`, `returns-policy-section`, `shipping-rates-table`, `customer-account-home`, `order-help-options`.
- Marketing, 9 more: `incident-postmortem`, `recipe-layout`, `article-footnotes`, `newsletter-card`, `sticky-cta-bar`, `pricing-rows`, `contact-form-centered`, `enterprise-plan-band`, `guarantee-panel`.
- Application, 6 more: `rail-panel-shell`, `section-sidebar-shell`, `record-page-shell`, `inspector-shell`, `summary-aside-shell`, `feed-shell`.
- Commerce, 8 more: `category-product-rows`, `reorder-list`, `brand-index`, `reviews-to-write`, `pickup-ready-card`, `trade-account-application`, `delivery-instructions`, `trade-credit-summary`.
- Primitives, 11 more: `barcode`, `loading-overlay`, `skeleton-group`, `text-skeleton`, `async-view`, `error-boundary`, `live-announcer`, `undo-toast`, `task-toast`, `dismissible-notice`, `last-updated`.
- Marketing, 10 more: `trial-timeline`, `talk-to-us-cta`, `audience-discounts`, `office-list`, `newsletter-lists`, `thank-you-next-steps`, `early-access-form`, `service-packages`, `refer-a-friend`, `ticket-tiers`.
- Primitives, 10 more: `new-items-pill`, `infinite-scroll-status`, `pull-to-refresh`, `eta-progress`, `strength-meter`, `milestone-progress`, `estimated-progress`, `slow-loading-state`, `activity-toast`, `optimistic-item`.
- Application, 8 more: `workbench-shell`, `map-panel-shell`, `notification-item`, `comment-item`, `message-bubble`, `task-row`, `task-card`, `project-card`.
- Primitives, 8 more: `update-highlight`, `email-field`, `username-field`, `url-field`, `slug-field`, `name-field`, `masked-input`, `date-field`.
- Commerce, 8 more: `warranty-registration`, `product-passport`, `product-safety-info`, `ranked-product-list`, `age-verification-gate`, `payment-plan-picker`, `price-transparency`, `sample-request`.
- Application, 10 more: `member-row`, `integration-card`, `event-chip`, `week-strip`, `feature-gate`, `activity-entry`, `time-tracker`, `checklist-card`, `note-card`, `inbox-row`.
- Marketing, 9 more: `credit-packs`, `rate-card`, `cohort-signup`, `webinar-signup`, `rsvp-form`, `booking-bar`, `upgrade-prompt`, `paywall-gate`, `call-us-section`.
- Commerce, 9 more: `plan-card`, `booking-summary`, `coupon-card`, `room-card`, `course-card`, `price-quote-card`, `flight-card`, `payment-card-preview`, `discount-field`.
- Marketing, 9 more: `coverage-check`, `free-audit-form`, `contact-faq-split`, `welcome-offer-signup`, `email-course-signup`, `newsletter-preview`, `promo-code-cta`, `app-download-qr`, `cta-photo-split`.
- Application, 11 more: `typing-indicator`, `reply-summary`, `help-launcher`, `call-log-row`, `chat-header`, `sla-timer`, `attendee-list`, `task-relations`, `two-column-sign-in`, `magic-link-sign-in`, `passkey-sign-in`.
- Primitives, 8 more: `time-field`, `birthday-field`, `scoped-search-field`, `recent-searches-field`, `autosuggest-field`, `markdown-field`, `image-picker`, `postal-code-field`.
- Primitives, 8 more: `multi-currency-field`, `percentage-field`, `amount-presets`, `time-range-field`, `due-date-field`, `recipient-field`, `link-field`, `bulk-paste-field`.
- Application, 8 more: `verify-email-card`, `set-new-password`, `invite-accept-card`, `sso-sign-in`, `reauthenticate-card`, `account-chooser`, `verification-method-picker`, `authorize-app-card`.
- Marketing, 10 more: `contact-form-routed`, `limited-offer-panel`, `name-your-price`, `join-count-cta`, `affiliate-offer`, `project-capacity`, `savings-receipt`, `cta-giant-link`, `screenshot-features`, `pillars-section`.
- Commerce, 9 more: `vat-price-field`, `card-fieldset`, `radio-accordion`, `rating-filter`, `product-pricing-fieldset`, `stock-adjust-field`, `category-nav`, `region-switcher`, `price-breakdown-popover`.
- Commerce, 4 more: `address-confirm-dialog`, `offer-list`, `line-items-table`, `price-matrix`.
- Primitives, 9 more: `quick-phrases-field`, `number-range-field`, `code-field`, `variable-textarea`, `sms-message-field`, `limit-field`, `filename-field`, `image-url-field`, `color-area-picker`.
- Marketing, 8 more: `feature-filter-grid`, `feature-carousel`, `feature-with-quote`, `feature-outcomes`, `capability-questions`, `good-fit-section`, `deployment-options`, `platform-availability`.
- Application, 10 more: `terms-update-gate`, `workspace-url-sign-in`, `phone-sign-in`, `device-code-entry`, `pin-lock-screen`, `relative-time`, `expandable-text`, `priority-indicator`, `testimonial-card`, `article-card`.
- Primitives, 8 more: `week-picker`, `dimensions-field`, `height-field`, `shorthand-number-field`, `natural-date-field`, `wheel-picker`, `currency-exchange-field`, `time-estimate-field`.
- Marketing, 8 more: `api-endpoints`, `sdk-grid`, `quickstart-steps`, `trust-documents`, `service-levels`, `which-one-guide`, `industry-index`, `import-sources`.
- Application, 11 more: `commit-list`, `appointment-card`, `company-card`, `invitation-card`, `api-endpoint`, `repo-card`, `experience-list`, `job-card`, `property-card`, `amenity-list`, `curriculum-list`.
- Primitives, 8 more: `cron-field`, `barcode-field`, `national-id-field`, `password-generator`, `rating-breakdown-field`, `aspect-ratio-picker`, `position-picker`, `contrast-pair-field`.
- Marketing, 9 more: `two-sided-features`, `extension-points`, `stack-layers`, `region-list`, `model-lineup`, `sync-mapping`, `automation-recipes`, `materials-section`, `certifications-explained`.
- Application, 10 more: `class-session-card`, `service-card`, `specialist-card`, `vehicle-card`, `venue-card`, `tour-card`, `app-listing-card`, `fundraiser-card`, `delivery-stop-card`, `book-card`.
- Application, 9 more: `recipe-card`, `ingredient-list`, `match-score-card`, `player-card`, `availability-calendar`, `membership-card`, `certificate-card`, `stamp-card`, `match-timeline`.
- Marketing, 7 more: `spend-breakdown`, `commitments-progress`, `membership-tiers`, `rollout-plan`, `app-screens-row`, `keyboard-features`, `prompt-examples`.
- Primitives, 10 more: `font-family-select`, `font-size-field`, `angle-field`, `box-sides-field`, `inline-field`, `choice-list`, `disabled-reason`, `async-select`, `creatable-select`, `language-select`.
- Primitives, 9 more: `chip-select`, `slider-field`, `weekday-picker`, `async-switch`, `likert-scale`, `radio-table`, `step-slider`, `listbox`, `expiry-select`.
- Application, 11 more: `season-strip`, `color-token-card`, `team-clocks`, `achievement-tile`, `stack-trace`, `offline-state`, `first-run-state`, `unavailable-state`, `update-available-bar`, `mode-bar`, `trial-status-bar`.
- Marketing, 6 more: `tour-chapters`, `locale-demo`, `theme-preview`, `dashboard-hero`, `ui-snippets-hero`, `trusted-by-hero`.
- Application, 10 more: `payment-failed-banner`, `verify-email-banner`, `bulk-result-summary`, `batch-progress`, `permission-primer`, `pwa-install-prompt`, `queue-position`, `coming-soon-state`, `suspicious-activity-alert`, `draft-restored-notice`.
- Primitives, 8 more: `emoji-scale`, `multi-date-picker`, `repeat-select`, `histogram-slider`, `threshold-slider`, `allocation-slider`, `preview-picker`, `cascade-select`.
- Marketing, 6 more: `api-request-hero`, `promo-slider-hero`, `collection-hero`, `marketplace-hero`, `local-business-hero`, `course-enroll-hero`.
- Primitives, 10 more: `icon-picker`, `rank-list`, `shortcut-recorder`, `container`, `form-grid`, `section-shell`, `sidebar-layout`, `reading-column`, `full-bleed-band`, `inset-panel`.
- Application, 8 more: `unsupported-browser-notice`, `needs-setup-state`, `notice-stack`, `streak-tracker`, `comment-composer`, `document-upload-row`, `image-upload-grid`, `image-alt-field`.
- Marketing, 7 more: `donation-hero`, `service-start-hero`, `property-search-hero`, `reservation-hero`, `appointment-hero`, `timetable-hero`, `advisor-hero`.
- Application, 8 more: `drop-overlay`, `form-actions`, `form-section`, `translatable-field`, `utm-builder`, `status-message-field`, `focal-point-field`, `image-cropper`.
- Primitives, 11 more: `aligned-card-grid`, `collapsing-columns`, `leader-list`, `inline-list`, `holy-grail-layout`, `split-screen`, `screen-frame`, `status-bar`, `collapsible-panes`, `chrome-offsets`, `floating-stack`.
- Marketing, 8 more: `podcast-hero`, `book-hero`, `lineup-hero`, `recipe-hero`, `matchday-hero`, `inline-image-hero`, `big-number-hero`, `gallery-hero`.
- Primitives, 8 more: `hairline-grid`, `bento-layout`, `progressive-image`, `thumbnail-strip`, `zoomable-image`, `photo-mosaic`, `justified-gallery`, `video-facade`.
- Application, 9 more: `conditional-fields`, `field-repeater`, `form-dialog`, `form-tabs`, `editable-section`, `danger-zone`, `contact-fieldset`, `social-links-fieldset`, `answers-review`.
- Marketing, 9 more: `community-hero`, `creator-hero`, `breathing-hero`, `navbar-centered-logo`, `navbar-with-search`, `navbar-transparent`, `navbar-onepage`, `footer-link-rows`, `footer-folding-columns`.
- Primitives, 9 more: `seek-bar`, `volume-control`, `audio-waveform`, `media-card`, `file-type-icon`, `browser-frame`, `phone-frame`, `qr-code`, `story-ring`.
- Application, 8 more: `form-outline`, `status-select`, `guest-picker`, `likert-matrix`, `answer-checklist`, `event-time-fieldset`, `send-schedule-field`, `quiet-hours-field`.
- Marketing, 10 more: `mobile-nav-drilldown`, `utility-bar`, `breadcrumb-bar`, `footer-app-stores`, `footer-local-business`, `footer-region-selector`, `locale-suggestion-bar`, `smart-app-banner`, `navbar-two-row`, `docs-header`.
- Primitives, 10 more: `hotspot-image`, `embed-consent`, `pausable-image`, `laptop-frame`, `image-tile`, `photo-stack`, `pattern-cover`, `play-clip-button`, `image-sequence`, `hover-video-preview`.
- Application, 7 more: `inherited-field`, `agreement-scroll`, `report-form`, `tiered-rates-editor`, `transfer-list`, `record-lookup`, `seo-fieldset`.
- Marketing, 10 more: `docs-page-footer`, `page-header-split`, `product-subnav`, `mobile-contact-bar`, `footer-regulatory`, `footer-trust-marks`, `footer-split-panel`, `family-sites-bar`, `navbar-floating`, `navbar-fullscreen-menu`.
- Marketing, 11 more: `navbar-side-rail`, `navbar-masthead`, `section-dots-nav`, `footer-inverted-contact`, `footer-curtain`, `print-letterhead`, `logo-strip`, `testimonial-list`, `reviews-by-source`, `headline-stat`, `press-mentions-list`.
- Primitives, 8 more: `responsive-tabs`, `folder-tabs`, `priority-nav`, `page-jump`, `related-links`, `filterable-nav`, `path-bar`, `history-controls`.
- Primitives, 10 more: `text-link`, `count-tabs`, `cursor-pagination`, `dot-stepper`, `compact-stepper`, `adaptive-pagination`, `breadcrumb-siblings`, `nav-rail`, `top-bar`, `floating-player`.
- Application, 8 more: `chapter-list`, `media-playlist`, `transcript-list`, `voice-message`, `quiz-options`, `sentence-fields`, `availability-grid`, `field-help-panel`.
- Application, 8 more: `task-list`, `wizard-footer`, `period-stepper`, `question-navigator`, `environment-switcher`, `accordion-steps`, `photo-select-grid`, `file-preview`.
- Marketing, 10 more: `quote-rail`, `logo-groups`, `video-testimonials`, `customer-results-table`, `claim-quotes`, `testimonials-by-role`, `logo-results-grid`, `satisfaction-scores`, `benchmark-bars`, `review-topics`.
- Marketing, 9 more: `expert-endorsements`, `customer-photo-grid`, `before-after-pairs`, `sponsor-tiers`, `alumni-outcomes`, `review-form`, `logo-quote-popovers`, `message-testimonials`, `quote-stack`.
- Primitives, 9 more: `alphabet-index`, `route-focus`, `stage-path`, `category-strip`, `lazy-tabs`, `closable-tabs`, `archive-nav`, `load-earlier`, `accessible-feed`.
- Application, 6 more: `branch-switcher`, `adaptive-nav`, `quick-exit`, `go-to-shortcuts`, `view-stack`, `filter-popover`.
- Primitives, 8 more: `swipe-tabs`, `floating-tab-bar`, `expanding-search`, `toc-rail`, `story-progress`, `card-tabs`, `responsive-dialog`, `choice-dialog`.
- Marketing, 1 more: `proof-bento`.
- Application, 8 more: `notification-popover`, `move-to-dialog`, `duplicate-dialog`, `find-in-page-bar`, `feedback-dialog`, `newsletter-dialog`, `external-link-dialog`, `embed-dialog`.
- Primitives, 10 more: `selectable-table`, `row-actions-menu`, `selection-banner`, `table-states`, `sticky-table`, `responsive-table`, `numeric-table`, `expandable-table`, `key-value-list`, `table-density-toggle`.
- Primitives, 10 more: `unsaved-changes-dialog`, `progress-dialog`, `action-sheet`, `form-sheet`, `help-popover`, `truncate-tooltip`, `go-to-dialog`, `video-dialog`, `cell-preview-popover`, `sortable-table`.
- Application, 7 more: `event-details-popover`, `template-picker-dialog`, `recommendation-reason-popover`, `document-stats-popover`, `props-table`, `timesheet-grid`, `attendance-register`.
- Application, 8 more: `access-level-menu`, `role-change-dialog`, `request-access-dialog`, `display-options-popover`, `recent-items-popover`, `avatar-group-popover`, `snooze-popover`, `local-time-popover`.
- Primitives, 9 more: `column-header-menu`, `table-cells`, `linked-row-table`, `editable-cell`, `grouped-list`, `pinnable-list`, `table-export-menu`, `table-column-resizer`, `column-group-table`.
- Primitives, 1 more: `navigable-grid`.
- Application, 5 more: `route-timetable`, `departures-board`, `standings-table`, `competition-results-table`, `design-token-table`.

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
