import { ColorTokenCard, type ColorTokenCardProps } from "@rhs-ui/application/color-token-card";

const TOKENS: readonly ColorTokenCardProps[] = [
  { name: "Forest 600", value: "#0A7D5C", token: "--color-forest-600", usage: "Primary actions and links on light surfaces." },
  { name: "Ink 900", value: "oklch(0.21 0.02 255)", token: "--color-ink-900", usage: "Body text and headings. Starts on oklch, the way it is written." },
  { name: "Signal 500", value: "rgb(231 111 38)", token: "--color-signal-500", usage: "Highlights and large figures. Never for small text on white." },
  { name: "Paper 100", value: "#F4EFE6", token: "--color-paper-100", usage: "Page background in the warm theme. Text on it must be dark." },
  { name: "Sky 400", value: "#5BA8FF", token: "--color-sky-400", usage: "Charts and focus rings on dark surfaces.", copyFormats: ["hex", "oklch"] },
  { name: "Scrim 60", value: "rgb(14 14 14 / 60%)", token: "--color-scrim", usage: "The veil behind a dialog. Measured as laid over white and over black." },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl gap-4">
      <p className="text-xs text-muted-foreground">The format button cycles hex, rgb and oklch and the copy button takes what is showing. Contrast is worked out in the browser with the WCAG 2 formula.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOKENS.map((token) => (
          <ColorTokenCard key={token.name} {...token} />
        ))}
      </div>
    </div>
  );
}
