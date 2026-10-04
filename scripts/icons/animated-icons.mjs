/**
 * The generated animated icons. Each entry takes a glyph from
 * registry/icons/index.tsx and moves some of its subpaths (0-based, in the
 * order they appear in the glyph's `d`); every subpath not named stays
 * still. Motions come from ./motion-presets.mjs.
 *
 *   a(glyph, description, label, parts, extra)
 *   part: [name, [subpath indices] | "*", motion | [motion, ...args], { delay, origin, duration }?]
 *
 * `label` finishes the usage snippet shown on rhsui.com; `loop: true` shows
 * it as a looping status line instead of inside a button.
 */
const a = (glyph, description, label, parts, extra = {}) => ({ glyph, description, label, parts, ...extra });
const stagger = (name, indices, motion, gap = 90, start = 0) => indices.map((index, i) => [`${name}-${i + 1}`, [index], motion, { delay: start + i * gap }]);

export const ICONS = [
  // Arrows & direction
  a("IconArrowLeft", "The arrow steps back and returns. For back links and previous steps.", "Back", [["arrow", [0, 1], ["nudge", -2.5, 0]]]),
  a("IconArrowUp", "The arrow lifts and settles. For scroll to top and sort ascending.", "Back to top", [["arrow", [0, 1], ["nudge", 0, -2.5]]]),
  a("IconArrowDown", "The arrow drops and settles. For scroll cues and sort descending.", "Scroll down", [["arrow", [0, 1], ["nudge", 0, 2.5]]]),
  a("IconChevronRight", "The chevron leans forward. For rows and menu items that open.", "Next", [["chevron", [0], ["nudge", 2, 0]]]),
  a("IconChevronLeft", "The chevron leans back. For previous and collapse.", "Previous", [["chevron", [0], ["nudge", -2, 0]]]),
  a("IconChevronDown", "The chevron dips. For dropdowns and expandable sections.", "More options", [["chevron", [0], ["nudge", 0, 2]]]),
  a("IconChevronUp", "The chevron rises. For collapse and back to top.", "Collapse", [["chevron", [0], ["nudge", 0, -2]]]),
  a("IconUndo", "The arrow turns back. For undo in editors.", "Undo", [["undo", [0, 1], ["tilt", -18, "50% 50%"]]]),
  a("IconRedo", "The arrow turns forward. For redo in editors.", "Redo", [["redo", [0, 1], ["tilt", 18, "50% 50%"]]]),
  a("IconMaximize", "The corners reach outwards. For fullscreen and expand.", "Fullscreen", [["out-a", [0, 2], ["nudge", 1.5, -1.5]], ["out-b", [1, 3], ["nudge", -1.5, 1.5]]]),
  a("IconMinimize", "The corners pull inwards. For exit fullscreen.", "Exit fullscreen", [["in-a", [0, 3], ["nudge", 1.5, -1.5]], ["in-b", [1, 2], ["nudge", -1.5, 1.5]]]),
  // Navigation
  a("IconHome", "The house hops. For home links and dashboards.", "Home", [["house", [0], ["bounce", 2]]]),
  a("IconFilter", "The funnel shakes its contents through. For filter panels.", "Filters", [["funnel", [0], ["wiggle", 8]]]),
  a("IconExternal", "The arrow leaves the box. For links that open a new tab.", "Open in new tab", [["arrow", [0, 1], ["nudge", 1.5, -1.5]]]),
  a("IconLogIn", "The arrow goes in through the door. For sign in.", "Sign in", [["arrow", [1, 2], ["nudge", 2, 0]]]),
  // Actions
  a("IconCheck", "The tick draws itself. For done, saved and confirmed.", "Done", [["tick", [0], "draw"]], { slug: "check-draw" }),
  a("IconClose", "The cross draws stroke by stroke. For dismiss and close.", "Close", stagger("stroke", [0, 1], ["draw", 360], 140)),
  a("IconMinus", "The line draws across. For remove and decrease.", "Remove", [["line", [0], ["draw", 420]]]),
  a("IconEdit", "The pencil scribbles. For edit buttons.", "Edit", [["pencil", [0, 1], ["wiggle", 8]]]),
  a("IconSave", "The disk presses in. For save.", "Save", [["disk", [0, 1, 2], "press"]]),
  a("IconShare", "The arrow lifts out of the tray. For share sheets.", "Share", [["arrow", [0, 1], ["nudge", 0, -2]]]),
  a("IconLink", "The links pull together. For copy link and attach URL.", "Copy link", [["left", [0], ["nudge", 1, -1]], ["right", [1], ["nudge", -1, 1]]]),
  a("IconZoomIn", "The plus grows inside the lens. For zoom in.", "Zoom in", [["plus", [2, 3], ["pop", 1.3]]]),
  a("IconZoomOut", "The minus shrinks inside the lens. For zoom out.", "Zoom out", [["minus", [2], "press"]]),
  a("IconMoreHorizontal", "The dots hop in a wave. For overflow menus.", "More", stagger("dot", [0, 1, 2], ["bounce", 2], 90)),
  a("IconMoreVertical", "The dots pop in turn. For overflow menus in rows.", "More", stagger("dot", [0, 1, 2], ["pop", 1.4], 90)),
  a("IconSliders", "The knobs slide along their tracks. For settings and filters.", "Adjust", [["knob-1", [3], ["nudge", 4, 0]], ["knob-2", [4], ["nudge", -4, 0], { delay: 80 }], ["knob-3", [5], ["nudge", 3, 0], { delay: 160 }]]),
  // Status & time
  a("IconInfo", "The i hops. For information and tips.", "About this", [["letter", [1, 2], ["bounce", 2]]]),
  a("IconWarning", "The triangle shakes. For warnings.", "Check this", [["sign", [0, 1, 2], "shake"]]),
  a("IconAlertCircle", "The exclamation mark shakes. For errors that need attention.", "Needs attention", [["mark", [1, 2], "shake"]]),
  a("IconXCircle", "The cross draws inside its ring. For failed and cancelled.", "Failed", stagger("stroke", [1, 2], ["draw", 360], 140)),
  a("IconHelp", "The question mark tilts, puzzled. For help and support.", "Help", [["mark", [1, 2], ["wiggle", 12]]]),
  a("IconCalendar", "The rings of the calendar hop. For dates and scheduling.", "Pick a date", stagger("ring", [2, 3], ["bounce", 1.5], 90)),
  a("IconLoader", "The spokes turn. For loading states.", "Loading", [["spokes", [0, 1, 2, 3, 4, 5], ["spin", 360]]], { loop: true, pause: 0 }),
  // People & access
  a("IconUser", "The head nods. For account and profile.", "Account", [["head", [0], ["bounce", 1.5]]]),
  a("IconUsers", "The second person steps in. For teams and members.", "Team", [["second", [2, 3], ["nudge", -1.5, 0]]]),
  a("IconKey", "The key turns. For API keys and access.", "API keys", [["key", [0, 1, 2, 3], ["tilt", -25, "20% 80%"]]]),
  a("IconShieldCheck", "The tick draws on the shield. For protected.", "Protected", [["tick", [1], "draw"]]),
  // Communication
  a("IconInbox", "The tray bounces. For inboxes.", "Inbox", [["tray", [0, 1, 2], ["bounce", 2]]]),
  // Files & documents
  a("IconFile", "The page pops. For files.", "File", [["page", [0, 1], ["pop", 1.1]]]),
  a("IconFolder", "The folder hops. For folders.", "Folder", [["folder", [0], ["bounce", 2]]]),
  a("IconImage", "The landscape draws. For images.", "Add image", [["hills", [1], ["draw", 520]], ["sun", [2], "reveal", { delay: 300 }]]),
  // Media
  a("IconVolume", "The sound waves reach out. For volume and unmute.", "Sound on", stagger("wave", [1, 2], "reveal", 120)),
  a("IconVolumeOff", "The cross shakes. For muted.", "Muted", [["cross", [1, 2], "shake"]]),
  a("IconMic", "The microphone pulses. For voice input.", "Voice input", [["capsule", [0], "pulse"]], { loop: true }),
  a("IconCamera", "The shutter clicks. For photo capture.", "Take photo", [["lens", [1], "blink"]]),
  // Devices & theme
  a("IconWifi", "The signal grows from the dot. For connection.", "Connected", stagger("arc", [2, 1, 0], "reveal", 110)),
  // Code & data
  a("IconCloudUpload", "The arrow rises into the cloud. For backups and uploads.", "Back up", [["arrow", [1, 2], ["through", 0, -4]]]),
  // Commerce
  a("IconTag", "The tag swings. For prices and labels.", "Price", [["tag", [0, 1], ["tilt", 12, "0% 0%"]]]),
  a("IconCreditCard", "The card slides. For payments.", "Pay", [["card", [0, 1, 2], ["drive"]]]),
  // Text & editing
  // Weather & nature
  // Travel & places
  // Health & sport
  // Learning & work
  // Shapes & layout
  // Food & drink
  // Home & living
  // Business & finance
  // Science & technology
  // Tools & building
];
