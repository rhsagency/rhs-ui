"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconCheck, IconCheckCircle } from "@rhs-ui/icons";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import {
  DEFAULT_FONTS,
  PREVIEW_PALETTE,
  type AppearanceDensity,
  type AppearanceFont,
  type AppearanceTheme,
  type AppearanceValue,
} from "@rhs-ui/application/appearance-settings/options";
import { cn } from "@/lib/utils";

export type { AppearanceDensity, AppearanceFont, AppearanceTheme, AppearanceValue } from "@rhs-ui/application/appearance-settings/options";

export interface AppearanceSettingsProps {
  /** The current choice. Controlled: update it in onChange and apply it yourself. */
  value: AppearanceValue;
  /** Called at once for every change; there is no save button. */
  onChange: (next: AppearanceValue) => void;
  /** The typefaces on offer. Pass an empty list to leave the font choice out. */
  fonts?: readonly AppearanceFont[];
  /** What "System" currently resolves to, so the card can say it. Detected from the browser when left out. */
  systemTheme?: "light" | "dark";
  title?: string;
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  className?: string;
}

const DARK_QUERY = "(prefers-color-scheme: dark)";
const subscribeScheme = (notify: () => void) => {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const schemeNow = (): "light" | "dark" => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light");
const schemeOnServer = (): "light" | "dark" => "light";

const THEMES: readonly { value: AppearanceTheme; label: string; caption?: string }[] = [
  { value: "light", label: "Light", caption: "Always light" },
  { value: "dark", label: "Dark", caption: "Always dark" },
  { value: "system", label: "System" },
];

const DENSITIES = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
] as const;

const SAMPLE_ROWS = [
  { title: "Q3 planning", meta: "2h ago" },
  { title: "Brand refresh", meta: "Yesterday" },
  { title: "Launch checklist", meta: "Mon" },
] as const;

/**
 * How the interface looks, chosen from pictures instead of words: three
 * small mock windows for the theme (each painted in its own palette, so the
 * previews stay true on any page theme), a density choice with a sample list
 * that tightens as you pick, and an optional font choice with a sample line.
 * Everything applies at once, is announced in a status line, and stays
 * monochrome: there are no accent colours to choose.
 */
export function AppearanceSettings({
  value,
  onChange,
  fonts = DEFAULT_FONTS,
  systemTheme,
  title = "Appearance",
  description = "Choose how the interface looks on this device. Every change applies at once.",
  headingLevel = 2,
  className,
}: AppearanceSettingsProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  // Theme, Density and Font sit one level below the title, so the outline nests instead of going flat.
  const Sub = headingLevel === 3 ? "h4" : "h3";
  const detected = useSyncExternalStore(subscribeScheme, schemeNow, schemeOnServer);
  const system = systemTheme ?? detected;
  const [status, setStatus] = useState<{ text: string; changed: boolean }>({ text: "Changes apply as soon as you make them.", changed: false });
  const font = fonts.find((item) => item.value === value.font) ?? fonts[0];

  const apply = (next: AppearanceValue, said: string) => {
    onChange(next);
    setStatus({ text: said, changed: true });
  };

  return (
    <Card data-slot="appearance-settings" role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 pb-0", className)}>
      <CardHeader className="pb-6">
        <CardTitle asChild>
          <Heading id={`${id}-title`} className="text-base">{title}</Heading>
        </CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <div className="divide-y divide-border border-t border-border px-6">
        <div className="py-6">
          <Sub id={`${id}-theme`} className="text-sm font-medium">Theme</Sub>
          <p className="mt-0.5 text-sm text-muted-foreground">Pick one, or let your device decide.</p>
          <RadioGroupPrimitive.Root
            aria-labelledby={`${id}-theme`}
            value={value.theme}
            onValueChange={(next) => {
              const theme = next as AppearanceTheme;
              apply({ ...value, theme }, theme === "system" ? `System theme on, currently ${system}.` : `${theme === "dark" ? "Dark" : "Light"} theme on.`);
            }}
            className="mt-4 grid grid-cols-3 gap-3"
          >
            {THEMES.map((option) => (
              <RadioGroupPrimitive.Item
                key={option.value}
                value={option.value}
                className="group/theme flex min-w-0 flex-col gap-2.5 rounded-xl p-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className="relative block">
                  {/* The ring stands off the preview by a gap of card colour, so it reads against a dark window on a dark page and a light one on a light page. */}
                  <span className="block overflow-hidden rounded-lg border border-border transition-[border-color,box-shadow] duration-150 group-hover/theme:border-foreground/40 group-data-[state=checked]/theme:ring-2 group-data-[state=checked]/theme:ring-foreground group-data-[state=checked]/theme:ring-offset-2 group-data-[state=checked]/theme:ring-offset-card motion-reduce:transition-none">
                    <ThemePreview theme={option.value} />
                  </span>
                  {/* Where the label row is too narrow for its badge, the check sits on the preview itself. */}
                  <RadioGroupPrimitive.Indicator
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-background ring-2 ring-card @md:hidden [&_svg]:size-2.5"
                  >
                    <IconCheck />
                  </RadioGroupPrimitive.Indicator>
                </span>
                <span className="flex items-start justify-between gap-2 px-0.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.value === "system" ? `Currently ${system}` : option.caption}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 hidden size-5 shrink-0 @md:inline-flex items-center justify-center rounded-full border border-border text-background transition-colors group-data-[state=checked]/theme:border-foreground group-data-[state=checked]/theme:bg-foreground motion-reduce:transition-none [&_svg]:size-3"
                  >
                    <RadioGroupPrimitive.Indicator>
                      <IconCheck />
                    </RadioGroupPrimitive.Indicator>
                  </span>
                </span>
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>
        </div>
        <div className="grid grid-cols-1 gap-5 py-6 @xl:grid-cols-2 @xl:gap-8">
          <div>
            <Sub id={`${id}-density`} className="text-sm font-medium">Density</Sub>
            <p className="mt-0.5 text-sm text-muted-foreground">How much room lists and tables take. Compact fits more on a screen.</p>
            <SegmentedControl
              label="Density"
              value={value.density}
              options={DENSITIES}
              className="mt-4"
              onValueChange={(next) => {
                const density = next as AppearanceDensity;
                apply({ ...value, density }, `${density === "compact" ? "Compact" : "Comfortable"} density on.`);
              }}
            />
          </div>
          <ul aria-hidden="true" inert className="divide-y divide-border self-start overflow-hidden rounded-lg border border-border bg-background">
            {SAMPLE_ROWS.map((row) => (
              <li
                key={row.title}
                className={cn(
                  "flex items-center gap-3 px-3 transition-[padding] duration-200 motion-reduce:transition-none",
                  value.density === "compact" ? "py-1.5 text-[0.8125rem]" : "py-3 text-sm",
                )}
              >
                <span className={cn("shrink-0 rounded-md bg-muted transition-[width,height] duration-200 motion-reduce:transition-none", value.density === "compact" ? "size-5" : "size-7")} />
                <span className="min-w-0 flex-1 truncate font-medium">{row.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{row.meta}</span>
              </li>
            ))}
          </ul>
        </div>
        {font ? (
          <div className="grid grid-cols-1 gap-5 py-6 @xl:grid-cols-2 @xl:gap-8">
            <div>
              <Sub id={`${id}-font`} className="text-sm font-medium">Font</Sub>
              <p className="mt-0.5 text-sm text-muted-foreground">The typeface for text across the product. Headings keep their own.</p>
              <SegmentedControl
                label="Font"
                value={font.value}
                options={fonts.map((item) => ({ value: item.value, label: item.label }))}
                className="mt-4"
                onValueChange={(next) => {
                  const chosen = fonts.find((item) => item.value === next);
                  if (chosen) apply({ ...value, font: chosen.value }, `${chosen.label} font on.`);
                }}
              />
            </div>
            <div aria-hidden="true" style={{ fontFamily: font.family }} className="flex items-center gap-4 self-start rounded-lg border border-border bg-muted/30 px-4 py-3.5">
              <span className="text-3xl leading-none tracking-[-0.02em]">Aa</span>
              <span className="min-w-0 text-sm leading-snug">Pack my box with five dozen liquor jugs.</span>
            </div>
          </div>
        ) : null}
      </div>
      <div className="rounded-b-xl border-t border-border bg-muted/40 px-6 py-3.5">
        <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
          {status.changed ? <IconCheckCircle className="size-4 shrink-0 text-foreground" /> : null}
          <span>{status.text}</span>
        </p>
      </div>
    </Card>
  );
}

/** One mock app window, drawn in the palette of the theme it stands for. */
function Scene({ theme }: { theme: "light" | "dark" }) {
  const c = PREVIEW_PALETTE[theme];
  return (
    <>
      <rect width="160" height="100" fill={c.page} />
      <rect width="160" height="13" fill={c.panel} />
      <rect y="13" width="160" height="1" fill={c.line} />
      <circle cx="7" cy="6.5" r="1.8" fill={c.soft} />
      <circle cx="13" cy="6.5" r="1.8" fill={c.soft} />
      <circle cx="19" cy="6.5" r="1.8" fill={c.soft} />
      <rect y="14" width="40" height="86" fill={c.panel} />
      <rect x="40" y="14" width="1" height="86" fill={c.line} />
      <rect x="7" y="23" width="26" height="5" rx="2.5" fill={c.strong} />
      <rect x="7" y="33" width="20" height="4" rx="2" fill={c.soft} />
      <rect x="7" y="41" width="24" height="4" rx="2" fill={c.soft} />
      <rect x="7" y="49" width="16" height="4" rx="2" fill={c.soft} />
      <rect x="52" y="24" width="52" height="7" rx="3.5" fill={c.strong} />
      <rect x="52" y="38" width="92" height="4" rx="2" fill={c.soft} />
      <rect x="52" y="46" width="78" height="4" rx="2" fill={c.soft} />
      <rect x="52.5" y="60.5" width="95" height="28" rx="4" fill={c.panel} stroke={c.line} />
      <rect x="60" y="68" width="28" height="12" rx="3" fill={c.strong} />
      <rect x="95" y="71" width="40" height="4" rx="2" fill={c.soft} />
    </>
  );
}

/** One window as a drawing; every preview is the same 160 by 100 grid, so two of them line up exactly. */
function MockWindow({ theme, className }: { theme: "light" | "dark"; className?: string }) {
  return (
    <svg viewBox="0 0 160 100" aria-hidden="true" focusable="false" className={cn("block h-auto w-full", className)}>
      <Scene theme={theme} />
    </svg>
  );
}

/** The window for a theme; System shows the light window on the left half and the dark one on the right half. */
function ThemePreview({ theme }: { theme: AppearanceTheme }) {
  if (theme !== "system") return <MockWindow theme={theme} />;
  return (
    <span className="relative block">
      <MockWindow theme="light" />
      <MockWindow theme="dark" className="absolute inset-0 h-full [clip-path:inset(0_0_0_50%)]" />
      <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#8a8a8a]" />
    </span>
  );
}
