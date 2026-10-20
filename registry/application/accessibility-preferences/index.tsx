"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { IconCheckCircle } from "@rhs-ui/icons";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { SettingsRow } from "@rhs-ui/primitives/settings-row";
import { Slider } from "@rhs-ui/primitives/slider";
import { Switch } from "@rhs-ui/primitives/switch";
import { TEXT_SIZE_STEPS, type AccessibilityPreferencesValue, type ContrastPreference, type MotionPreference } from "@rhs-ui/application/accessibility-preferences/steps";
import { cn } from "@/lib/utils";

export type { AccessibilityPreferencesValue, ContrastPreference, MotionPreference, TextSizeStep } from "@rhs-ui/application/accessibility-preferences/steps";

export interface AccessibilityPreferencesProps {
  /** The current preferences. Controlled: update it in onChange. */
  value: AccessibilityPreferencesValue;
  /** Called at once for every change. Applying it (data attributes, CSS variables) is yours. */
  onChange: (next: AccessibilityPreferencesValue) => void;
  /** What the system asks for, so "Follow system" can say what it resolves to. Detected from the browser when left out. */
  systemMotion?: "reduce" | "allow";
  title?: string;
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  className?: string;
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (notify: () => void) => {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const motionNow = (): "reduce" | "allow" => (window.matchMedia(MOTION_QUERY).matches ? "reduce" : "allow");
const motionOnServer = (): "reduce" | "allow" => "allow";

const MOTION_OPTIONS = [
  { value: "system", label: "Follow system" },
  { value: "reduce", label: "Reduce" },
  { value: "allow", label: "Allow" },
] as const;

const CONTRAST_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "more", label: "More" },
] as const;

const percent = (scale: number) => `${Math.round(scale * 100)}%`;

/**
 * The settings people reach for first, as ordinary settings instead of a
 * hidden menu: text size on a five-step slider above a live sample, motion,
 * contrast, underlined links and keyboard hints. Each row says what it
 * changes and what it will look like, the sample shows it, and every change
 * applies at once and is announced politely.
 */
export function AccessibilityPreferences({
  value,
  onChange,
  systemMotion,
  title = "Accessibility",
  description = "Make the product easier to read and to move around in. Every setting applies the moment you change it.",
  headingLevel = 2,
  className,
}: AccessibilityPreferencesProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const detected = useSyncExternalStore(subscribeMotion, motionNow, motionOnServer);
  const system = systemMotion ?? detected;
  const [status, setStatus] = useState<{ text: string; changed: boolean }>({ text: "Changes apply as soon as you make them.", changed: false });
  const sliderBox = useRef<HTMLDivElement>(null);

  const step = TEXT_SIZE_STEPS[Math.min(Math.max(value.textSize, 0), TEXT_SIZE_STEPS.length - 1)] ?? TEXT_SIZE_STEPS[1]!;
  const size = `${step.label}, ${percent(step.scale)}`;

  // The slider thumb reports 0 to 4; give assistive technology the words.
  useEffect(() => {
    sliderBox.current?.querySelector('[role="slider"]')?.setAttribute("aria-valuetext", size);
  }, [size]);

  const apply = (next: AccessibilityPreferencesValue, said: string) => {
    onChange(next);
    setStatus({ text: said, changed: true });
  };

  const motionLine: Record<MotionPreference, string> = {
    system:
      system === "reduce"
        ? "Your device asks for reduced motion, so panels and menus appear without sliding or fading."
        : "Your device allows motion, so panels and menus slide and fade as designed.",
    reduce: "Panels and menus appear at once. Nothing slides, fades or loops.",
    allow: "Panels and menus slide and fade as designed, even if your device asks for less.",
  };
  const contrastLine: Record<ContrastPreference, string> = {
    standard: "Borders and secondary text keep their normal strength.",
    more: "Borders turn darker and secondary text becomes full strength, which helps in bright light.",
  };

  return (
    <Card data-slot="accessibility-preferences" role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 pb-0", className)}>
      <CardHeader className="pb-6">
        <CardTitle asChild>
          <Heading id={`${id}-title`} className="text-base">{title}</Heading>
        </CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <div className="divide-y divide-border border-t border-border px-6">
        <div className="grid grid-cols-1 gap-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Text size</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Scales text across the product. Larger sizes reflow and nothing is cut off.</p>
            </div>
            <p className="shrink-0 pt-0.5 text-sm font-medium tabular-nums">{size}</p>
          </div>
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="text-xs font-medium text-muted-foreground">A</span>
            <div ref={sliderBox} className="relative flex-1">
              <Slider
                min={0}
                max={TEXT_SIZE_STEPS.length - 1}
                step={1}
                value={[value.textSize]}
                thumbLabels={["Text size"]}
                onValueChange={([next]) => {
                  const chosen = TEXT_SIZE_STEPS[next ?? value.textSize];
                  if (next === undefined || next === value.textSize || !chosen) return;
                  apply({ ...value, textSize: next }, `Text size set to ${chosen.label.toLowerCase()}, ${percent(chosen.scale)}.`);
                }}
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[calc(50%+10px)] h-2">
                {TEXT_SIZE_STEPS.map((tick, index) => (
                  <span key={tick.label} className="absolute top-0 h-full w-px -translate-x-1/2 bg-muted-foreground/40" style={{ left: `calc(10px + (100% - 20px) * ${index / (TEXT_SIZE_STEPS.length - 1)})` }} />
                ))}
              </span>
            </div>
            <span aria-hidden="true" className="text-xl font-medium text-muted-foreground">A</span>
          </div>
          <Sample scale={step.scale} underlineLinks={value.underlineLinks} keyboardHints={value.keyboardHints} moreContrast={value.contrast === "more"} />
        </div>
        <ChoiceRow label="Motion" description={motionLine[value.motion]}>
          <SegmentedControl
            label="Motion"
            value={value.motion}
            options={MOTION_OPTIONS}
            className="[&>button]:px-2 [&>button]:text-[0.8125rem] @sm:[&>button]:px-3 @sm:[&>button]:text-sm"
            onValueChange={(next) => {
              const motion = next as MotionPreference;
              apply(
                { ...value, motion },
                motion === "system" ? `Motion now follows your system, which ${system === "reduce" ? "asks for reduced motion" : "allows motion"}.` : motion === "reduce" ? "Reduced motion is on." : "Motion is allowed.",
              );
            }}
          />
        </ChoiceRow>
        <ChoiceRow label="Contrast" description={contrastLine[value.contrast]}>
          <SegmentedControl
            label="Contrast"
            value={value.contrast}
            options={CONTRAST_OPTIONS}
            className="[&>button]:px-2 [&>button]:text-[0.8125rem] @sm:[&>button]:px-3 @sm:[&>button]:text-sm"
            onValueChange={(next) => {
              const contrast = next as ContrastPreference;
              apply({ ...value, contrast }, contrast === "more" ? "More contrast is on." : "Standard contrast is on.");
            }}
          />
        </ChoiceRow>
        <SettingsRow
          label="Always underline links"
          htmlFor={`${id}-underline`}
          className="grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8"
          description={<span id={`${id}-underline-d`}>{value.underlineLinks ? "Every link is underlined, so you never have to rely on colour or weight to find one." : "Links are underlined when you point at them or tab to them."}</span>}
        >
          <Switch
            id={`${id}-underline`}
            checked={value.underlineLinks}
            aria-describedby={`${id}-underline-d`}
            onCheckedChange={(next) => apply({ ...value, underlineLinks: next }, next ? "Links are now always underlined." : "Links are now underlined on hover and focus only.")}
          />
        </SettingsRow>
        <SettingsRow
          label="Show keyboard hints"
          htmlFor={`${id}-hints`}
          className="grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8"
          description={<span id={`${id}-hints-d`}>{value.keyboardHints ? "Shortcuts appear next to buttons and menu items, like Cmd K for search." : "Shortcuts stay hidden. They keep working."}</span>}
        >
          <Switch
            id={`${id}-hints`}
            checked={value.keyboardHints}
            aria-describedby={`${id}-hints-d`}
            onCheckedChange={(next) => apply({ ...value, keyboardHints: next }, next ? "Keyboard hints are now shown." : "Keyboard hints are now hidden.")}
          />
        </SettingsRow>
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

/**
 * A setting whose control is a segmented choice. It follows the card's own width, not the screen's:
 * the choice sits beside the text once the card is 36rem wide and under it before that, so the text
 * keeps a readable line even when the card lives in a narrow column on a wide screen.
 */
function ChoiceRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 py-5 @xl:grid-cols-[minmax(0,1fr)_auto] @xl:items-center @xl:gap-x-8">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

/** A sentence, a link and a button that wear the chosen settings, so the effect is seen before it is trusted. */
function Sample({ scale, underlineLinks, keyboardHints, moreContrast }: { scale: number; underlineLinks: boolean; keyboardHints: boolean; moreContrast: boolean }) {
  const soft = moreContrast ? "text-foreground" : "text-muted-foreground";
  return (
    <div aria-hidden="true" inert className={cn("rounded-lg border bg-muted/30 p-4 transition-colors motion-reduce:transition-none", moreContrast ? "border-foreground/60" : "border-border")}>
      <p className={cn("text-xs font-medium", soft)}>Sample</p>
      <div style={{ fontSize: `${scale}rem` }} className="mt-2 leading-snug">
        <p className="font-medium tracking-[-0.01em]">Your March invoice is ready</p>
        <p className={cn("mt-1", soft)}>
          It covers 3 seats and 12 GB of storage. Open the{" "}
          <span className={cn("font-medium text-foreground underline-offset-4", underlineLinks ? "underline" : "no-underline")}>billing guide</span> if something looks off.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center rounded-md border bg-background px-[0.9em] py-[0.4em] font-medium", moreContrast ? "border-foreground/60" : "border-border")}>Download PDF</span>
          {keyboardHints ? (
            <KbdGroup className={moreContrast ? "[&_kbd]:border-foreground/60 [&_kbd]:text-foreground" : undefined}>
              <Kbd>⌘</Kbd>
              <Kbd>D</Kbd>
            </KbdGroup>
          ) : null}
        </div>
      </div>
    </div>
  );
}
