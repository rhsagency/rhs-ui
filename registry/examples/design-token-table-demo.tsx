import type { ReactNode } from "react";

import { DesignTokenTable, type DesignToken } from "@rhs-ui/application/design-token-table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12 p-2 sm:p-6">
      <Example caption="Brand tokens, each drawn as itself">
        <DesignTokenTable tokens={HALCYON} background="--surface" idPrefix="halcyon-" defaultFolded={["Motion"]} caption="Halcyon design tokens, version 4.2" />
      </Example>

      <Example caption="A flat list without groups">
        <DesignTokenTable tokens={SCALE} idPrefix="scale-" caption="Radius scale" />
      </Example>
    </div>
  );
}

// Colour is the content here: these are the swatches of a brand, shown on the page's own neutral ground.
const HALCYON: readonly DesignToken[] = [
  { name: "--surface", value: "#FFFFFF", type: "color", group: "Colour", usage: "The page behind everything. Every ratio below is measured against it." },
  { name: "--ink", value: "oklch(0.21 0.02 255)", type: "color", group: "Colour", usage: "Body text and headings." },
  { name: "--ink-muted", value: "#5B6272", type: "color", group: "Colour", usage: "Captions, labels and other secondary text." },
  { name: "--ink-faint", value: "#8A90A0", type: "color", group: "Colour", usage: "Placeholders and disabled text. Large text only." },
  { name: "--warning", value: "#E8A317", type: "color", group: "Colour", usage: "Icons and bars. Never for text on white: it fails." },
  { name: "--accent-soft", value: "rgb(31 79 216 / 12%)", type: "color", group: "Colour", contrast: false, usage: "The plate behind a selected row. Laid over the surface, so it is see-through." },
  { name: "--space-2", value: "0.5rem", type: "size", group: "Spacing", usage: "Between an icon and its label." },
  { name: "--space-8", value: "2rem", type: "size", group: "Spacing", usage: "Between sections of a form." },
  { name: "--container-md", value: "32rem", type: "size", group: "Spacing", usage: "The width of a dialog and of reading text." },
  { name: "--radius-md", value: "0.5rem", type: "radius", group: "Radius", usage: "Buttons and fields." },
  { name: "--radius-xl", value: "1rem", type: "radius", group: "Radius", usage: "Cards and panels." },
  { name: "--radius-full", value: "9999px", type: "radius", group: "Radius", usage: "Avatars and pills." },
  { name: "--shadow-sm", value: "0 1px 2px 0 rgb(0 0 0 / 0.08)", type: "shadow", group: "Shadow", usage: "A card at rest." },
  { name: "--shadow-lg", value: "0 16px 32px -8px rgb(0 0 0 / 0.2)", type: "shadow", group: "Shadow", usage: "A dialog above its scrim." },
  { name: "--font-sans", value: '"Instrument Sans", ui-sans-serif, system-ui, sans-serif', type: "font", group: "Typography", usage: "Interface and body text." },
  { name: "--font-mono", value: '"JetBrains Mono", ui-monospace, monospace', type: "font", group: "Typography", usage: "Code, ids and anything compared character by character." },
  { name: "--duration-fast", value: "120ms", type: "duration", group: "Motion", usage: "Hover and press feedback." },
  { name: "--duration-base", value: "200ms", type: "duration", group: "Motion", usage: "Menus, tabs and toggles." },
  { name: "--duration-slow", value: "400ms", type: "duration", group: "Motion", usage: "Sheets and dialogs entering." },
];

const SCALE: readonly DesignToken[] = [
  { name: "--radius-sm", value: "0.25rem", type: "radius", usage: "Badges and keyboard keys." },
  { name: "--radius-md", value: "0.5rem", type: "radius", usage: "Buttons and fields." },
  { name: "--radius-xl", value: "1rem", type: "radius", usage: "Cards and panels." },
  { name: "--radius-full", value: "9999px", type: "radius", usage: "Avatars and pills." },
];
