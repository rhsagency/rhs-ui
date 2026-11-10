"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { aspectRatio, clampSize, DEFAULT_LABELS, DEFAULT_SETTINGS, fill, LIMITS, type EmbedControl, type EmbedLabels, type EmbedSettings, type EmbedTheme } from "@rhs-ui/application/embed-dialog/snippet";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Button } from "@rhs-ui/primitives/button";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { DialogClose, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface EmbedPanelProps {
  /** Writes the code for the settings, as a string: an iframe, a script tag, whatever you embed with. It runs again each time something changes. Escape every value that goes into an attribute with `escapeAttribute`, or start from `iframeSnippet`. */
  buildSnippet: (settings: EmbedSettings) => string;
  /** What the settings start as. Default 640 by 360 pixels, light, not responsive. */
  defaults?: Partial<EmbedSettings>;
  /** Which options to show: "width", "height", "theme" and "responsive". Leave one out and the person cannot change it. Default all four. */
  controls?: readonly EmbedControl[];
  /** A page to show in the preview, in a sandboxed frame sized like the embed. A function of the settings can put the theme in the address. Leave it out, and `preview`, for no preview. */
  previewUrl?: string | ((settings: EmbedSettings) => string);
  /** The page in `previewUrl` is yours, so it may keep its own origin (its storage and cookies). Without this the frame is sandboxed with scripts but without `allow-same-origin`, which is what keeps a page on your own origin from lifting its sandbox. Default false. */
  trustedPreview?: boolean;
  /** Draws the preview yourself, from the settings, when a frame is not an option: a mock, or the component itself. It takes the place of `previewUrl`. */
  preview?: (settings: EmbedSettings) => ReactNode;
  /** What the preview frame is, for screen readers. Default "Preview". */
  previewTitle?: string;
  /** The code was copied, with the code. */
  onCopy?: (snippet: string) => void;
  /** Called with all the settings each time one of them changes. */
  onSettingsChange?: (settings: EmbedSettings) => void;
  /** Draw the panel on its own (a page, a sheet, a preview) instead of inside a Dialog. The title is then a plain heading. */
  standalone?: boolean;
  /** Called when "Done" is pressed in a standalone panel. Inside a Dialog the button closes it. */
  onClose?: () => void;
  /** The language the sizes are written in. Default "en-US". */
  locale?: string;
  /** The words the panel says, for translation. */
  labels?: EmbedLabels;
  /** Classes for the panel. */
  className?: string;
}

const ALL_CONTROLS: readonly EmbedControl[] = ["width", "height", "theme", "responsive"];

/** The tallest a preview is drawn, in pixels. */
const PREVIEW_HEIGHT = 300;

function Heading({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <h2 className={className}>{children}</h2> : <DialogTitle className={className}>{children}</DialogTitle>;
}

function Lede({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <p className={className}>{children}</p> : <DialogDescription className={className}>{children}</DialogDescription>;
}

interface UnitFieldProps {
  label: string;
  unit: string;
  value: number;
  /** What the field shows instead of the number, while it cannot be changed. */
  stand?: string;
  disabled?: boolean;
  onValueChange: (value: number) => void;
}

/**
 * A number with its unit after it. The code follows every keystroke that is a size it can use; a number out of range waits and
 * is marked, and is brought into range when the field is left. Up and Down arrows step by one, with Shift by ten.
 */
function UnitField({ label, unit, value, stand, disabled, onValueChange }: UnitFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const typed = draft !== null && draft !== "" ? Number(draft) : null;
  const outside = typed !== null && (typed < LIMITS.min || typed > LIMITS.max);

  function keys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const next = clampSize((typed ?? value) + (event.key === "ArrowUp" ? 1 : -1) * (event.shiftKey ? 10 : 1));
    setDraft(String(next));
    onValueChange(next);
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup>
        <InputGroupInput
          id={id}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          aria-invalid={outside || undefined}
          value={disabled && stand ? stand : (draft ?? String(value))}
          className="tabular-nums"
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
            setDraft(digits);
            const number = Number(digits);
            if (digits !== "" && number >= LIMITS.min && number <= LIMITS.max) onValueChange(number);
          }}
          onBlur={() => {
            if (draft === null) return;
            if (draft !== "") onValueChange(clampSize(Number(draft)));
            setDraft(null);
          }}
          onKeyDown={keys}
        />
        {unit ? <InputGroupAddon>{unit}</InputGroupAddon> : null}
      </InputGroup>
    </div>
  );
}

/** How many lines the code takes, for the browsers that cannot size a textarea to its text. A row more than there are lines leaves room for the scroll bar under them: better than a last line out of sight. */
const guessRows = (code: string) => Math.min(14, Math.max(4, code.split("\n").length + 1));

/** The preview: the embed at its real size, shrunk to fit when the room is smaller, or filling the width at its shape when it is responsive. */
function Frame({ settings, caption, scaledWords, fluidWords, locale, children }: { settings: EmbedSettings; caption: string; scaledWords: string; fluidWords: string; locale: string; children: ReactNode }) {
  const room = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // Measured before the first paint, so a preview never shows at full size for a frame and then shrinks.
  useLayoutEffect(() => {
    const element = room.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // Shrunk to the room it has, and never taller than the preview is allowed to be: a very tall embed is shown small, not endlessly long.
  const scale = settings.responsive || width === 0 ? 1 : Math.min(1, width / settings.width, PREVIEW_HEIGHT / settings.height);
  const number = new Intl.NumberFormat(locale);
  return (
    <figure className="m-0 grid grid-cols-[minmax(0,1fr)] gap-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
        <span className="font-medium">{caption}</span>
        <span className="text-muted-foreground tabular-nums">
          {settings.responsive ? fluidWords : `${number.format(settings.width)} × ${number.format(settings.height)}${scale < 1 ? ` · ${fill(scaledWords, { percent: Math.round(scale * 100) })}` : ""}`}
        </span>
      </figcaption>
      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <div ref={room} className="w-full overflow-hidden">
          {settings.responsive ? (
            // As wide as the room allows, but no wider than makes it taller than PREVIEW_HEIGHT at this shape.
            <div
              style={{ aspectRatio: `${settings.width} / ${settings.height}`, width: `min(100%, ${(PREVIEW_HEIGHT * settings.width) / settings.height}px)` }}
              className="relative mx-auto overflow-hidden rounded-md border border-border bg-background shadow-xs"
            >
              <div className="absolute inset-0">{children}</div>
            </div>
          ) : (
            <div style={{ width: settings.width * scale, height: settings.height * scale }} className="mx-auto overflow-hidden rounded-md border border-border bg-background shadow-xs">
              <div style={{ width: settings.width, height: settings.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}

/**
 * The inside of the embed dialog, on its own. Width and height are number fields with a unit, Responsive turns the code into a
 * full-width wrapper that keeps the shape, and Theme is a segmented control. The code updates with every choice and the copy
 * button beside it confirms and is announced; the code keeps its own lines and scrolls sideways when one is too long. An optional
 * preview draws the same settings in a frame of the same size, labelled so people see what they will get. Use it inside a Dialog,
 * or with `standalone` anywhere else.
 */
export function EmbedPanel({
  buildSnippet,
  defaults,
  controls = ALL_CONTROLS,
  previewUrl,
  trustedPreview = false,
  preview,
  previewTitle,
  onCopy,
  onSettingsChange,
  standalone = false,
  onClose,
  locale = "en-US",
  labels,
  className,
}: EmbedPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const [settings, setSettings] = useState<EmbedSettings>(() => ({ ...DEFAULT_SETTINGS, ...defaults }));
  const snippet = buildSnippet(settings);
  const on = (control: EmbedControl) => controls.includes(control);
  const pictured = preview !== undefined || previewUrl !== undefined;
  const address = typeof previewUrl === "function" ? previewUrl(settings) : previewUrl;

  function update(patch: Partial<EmbedSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    onSettingsChange?.(next);
  }

  return (
    <div data-slot="embed-panel" className={cn("@container flex min-h-0 flex-col", className)}>
      <div className="shrink-0 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
        <Heading standalone={standalone} className="text-lg leading-tight font-semibold tracking-[-0.02em]">
          {words.title}
        </Heading>
        <Lede standalone={standalone} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {words.description}
        </Lede>
      </div>

      {/* One column; with a preview and room (a dialog as wide as 42rem) the options sit beside the preview and the code runs under both, so the code and its copy button are on screen without scrolling. */}
      <div
        className={cn(
          "relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-5 overflow-y-auto px-5 pb-6 sm:px-6 @2xl:gap-x-6",
          pictured && "@2xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]",
        )}
      >
        <div className="grid min-w-0 content-start gap-5 empty:hidden">
          {on("width") || on("height") ? (
            <div className="grid grid-cols-2 gap-3">
              {on("width") ? (
                <UnitField label={words.width} unit={settings.responsive ? "" : words.unit} value={settings.width} stand={words.fullWidth} disabled={settings.responsive} onValueChange={(width) => update({ width })} />
              ) : null}
              {on("height") ? <UnitField label={words.height} unit={words.unit} value={settings.height} onValueChange={(height) => update({ height })} /> : null}
            </div>
          ) : null}

          {on("theme") ? (
            <div className="grid gap-1.5">
              <p className="text-sm leading-none font-medium">{words.theme}</p>
              <SegmentedControl
                label={words.theme}
                value={settings.theme}
                onValueChange={(theme) => update({ theme: theme as EmbedTheme })}
                options={[
                  { value: "light", label: words.light },
                  { value: "dark", label: words.dark },
                  { value: "auto", label: words.auto },
                ]}
              />
            </div>
          ) : null}

          {on("responsive") ? (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-3.5 py-3">
              <div className="grid gap-1">
                <Label htmlFor={`${id}-responsive`}>{words.responsive}</Label>
                <p id={`${id}-responsive-hint`} className="text-[0.8125rem] leading-snug text-muted-foreground">
                  {fill(words.responsiveHint, { ratio: aspectRatio(settings.width, settings.height) })}
                </p>
              </div>
              <Switch id={`${id}-responsive`} checked={settings.responsive} aria-describedby={`${id}-responsive-hint`} onCheckedChange={(responsive) => update({ responsive })} />
            </div>
          ) : null}
        </div>

        {pictured ? (
          <Frame settings={settings} caption={words.preview} scaledWords={words.previewScaled} fluidWords={words.previewFluid} locale={locale}>
            {preview ? (
              <div className="size-full overflow-hidden">{preview(settings)}</div>
            ) : (
              <iframe
                src={address}
                title={previewTitle ?? words.preview}
                loading="lazy"
                referrerPolicy="no-referrer"
                // Scripts run, but in an origin of their own: with allow-same-origin as well, a page on the same origin as this one could take its own sandbox off.
                sandbox={trustedPreview ? "allow-scripts allow-same-origin allow-popups allow-forms" : "allow-scripts allow-popups allow-forms"}
                className="size-full border-0 bg-background"
              />
            )}
          </Frame>
        ) : null}

        {/* min-h-min: a grid shrinks an overflow-hidden item first when the body is taller than the dialog; the body scrolls instead. */}
        <div className="min-h-min overflow-hidden rounded-lg border border-border bg-muted/40 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 @2xl:col-span-full">
          <div className="flex h-10 items-center justify-between gap-3 border-b border-border pr-1.5 pl-4">
            <label htmlFor={`${id}-code`} className="font-mono text-xs text-muted-foreground">
              {words.code}
            </label>
            <CopyButton value={snippet} label={words.copy} copiedLabel={words.copied} variant="ghost" size="sm" onCopy={onCopy} />
          </div>
          <textarea
            id={`${id}-code`}
            readOnly
            spellCheck={false}
            // Code is not wrapped: a line that is too long scrolls sideways, so the lines stay the lines of the code (one attribute each, indented)
            // and a word is never cut in two. Wrapping at the edge broke words and set the indent of a long line on a line of its own.
            wrap="off"
            rows={guessRows(snippet)}
            value={snippet}
            onFocus={(event) => event.currentTarget.select()}
            className="relative block max-h-80 w-full resize-none overflow-auto bg-transparent px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre text-foreground outline-none field-sizing-content"
          />
        </div>
      </div>

      <div className="flex shrink-0 justify-end border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
        {standalone ? (
          <Button type="button" variant="outline" onClick={onClose}>
            {words.done}
          </Button>
        ) : (
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {words.done}
            </Button>
          </DialogClose>
        )}
      </div>
    </div>
  );
}
