"use client";

import { useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { SamplePanel } from "@rhs-ui/marketing/theme-preview/sample-panel";
import { DEFAULT_THEMES, resolveTheme, type PreviewTheme } from "@rhs-ui/marketing/theme-preview/themes";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export type { PreviewTheme, ThemeTokens } from "@rhs-ui/marketing/theme-preview/themes";

export interface ThemePreviewLabels {
  /** The name of the theme switch for assistive technology. */
  switchLabel: string;
  /** Said politely when the switch changes. {label} stands for the theme picked. */
  showing: string;
  /** The name of the preview region. {label} stands for the theme it is in. */
  preview: string;
}

export interface ThemePreviewProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue"> {
  /** The small line over the heading: "Theming". */
  eyebrow?: string;
  /** The heading. It also names the section for assistive technology. */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3;
  /** The themes in the switch. Light, dark and high contrast by default, with their colours built in. */
  themes?: readonly PreviewTheme[];
  /** The id of the theme shown, when you control it. */
  theme?: string;
  /** The id of the theme shown first, when you do not. The first of `themes` by default. */
  defaultTheme?: string;
  /** Called with the id of the theme that has been picked. */
  onThemeChange?: (id: string) => void;
  /** Your own markup, drawn in place of the sample. It takes the semantic tokens of the theme like everything else in the preview. */
  children?: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ThemePreviewLabels>;
}

const LABELS: ThemePreviewLabels = {
  switchLabel: "Theme",
  showing: "Showing the {label} theme",
  preview: "Preview in the {label} theme",
};

/**
 * Theming as something a visitor can see: a small product screen drawn inside
 * a frame that has a theme of its own, and a switch above it between light,
 * dark and high contrast. The frame carries data-theme, redefines the
 * semantic tokens (background, foreground, card, border, ring and the rest)
 * on itself and sets color-scheme, so the sample, its form controls and its
 * scrollbars all follow, while the page around it keeps the theme it is in.
 * Because the sample is built from the same components and tokens as the rest
 * of RHS UI, it is the real thing and not a picture of it, and you can hover,
 * focus and press it in each theme. Give it your own markup as children, and
 * your own palettes as themes, to show a design system, a white-label product
 * or a dashboard that takes dark mode seriously. Changing the theme is
 * announced as "Showing the Dark theme".
 *
 * Only the semantic tokens (and [data-theme] selectors) follow the frame. A
 * `dark:` variant in your own markup follows the page's dark mode instead, so
 * a Light frame inside a dark page keeps its dark: styles on. The frame also
 * carries a "light" or "dark" class, which is what lets you scope the variant
 * to it, in your CSS: `@custom-variant dark (&:is(.dark *):not(.light *));`.
 */
export function ThemePreview({
  eyebrow,
  title,
  description,
  headingLevel = 2,
  themes = DEFAULT_THEMES,
  theme,
  defaultTheme,
  onThemeChange,
  children,
  labels: custom,
  className,
  ...props
}: ThemePreviewProps) {
  const labels = { ...LABELS, ...custom };
  const [inner, setInner] = useState(defaultTheme ?? themes[0]?.id ?? "light");
  // Said only once the switch has been used: a first render that announces itself is noise.
  const [said, setSaid] = useState("");
  const id = theme ?? inner;
  const current = themes.find((item) => item.id === id) ?? themes[0];
  if (!current) return null;
  const { scheme, tokens } = resolveTheme(current);

  const choose = (next: string) => {
    const item = themes.find((option) => option.id === next);
    if (!item) return;
    if (theme === undefined) setInner(next);
    setSaid(labels.showing.replace("{label}", item.label));
    onThemeChange?.(next);
  };

  return (
    <section data-slot="theme-preview" aria-label={title} className={cn("w-full break-words", className)} {...props}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        as={headingLevel === 3 ? "h3" : "h2"}
        action={
          <SegmentedControl
            label={labels.switchLabel}
            options={themes.map((item) => ({ value: item.id, label: item.label }))}
            value={current.id}
            onValueChange={choose}
            className="w-full flex-wrap sm:w-auto sm:flex-nowrap [&>button]:flex-1 sm:[&>button]:flex-none"
          />
        }
        className="gap-x-8 gap-y-6 [&>div:last-child]:max-sm:w-full"
      />

      {/* The frame: its own tokens and color-scheme, and the scheme as a class too ("light" or "dark"). Only the tokens follow the frame: a `dark:` variant still follows the page's own .dark ancestor, so a Light frame in a dark page keeps its dark: styles on. Scope the variant to make it follow the frame (see the docs above). */}
      <div
        role="group"
        aria-label={labels.preview.replace("{label}", current.label)}
        data-slot="theme-preview-frame"
        data-theme={current.id}
        style={{ ...tokens, colorScheme: scheme } as CSSProperties}
        className={cn(scheme, "relative mt-8 overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-sm sm:mt-10")}
      >
        {children ?? <SamplePanel />}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </section>
  );
}
