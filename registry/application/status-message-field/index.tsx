"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconClose, IconSmile } from "@rhs-ui/icons";
import { DEFAULT_CLEAR_OPTIONS, DEFAULT_PRESETS, resolveClear, type ClearOption, type StatusPreset } from "@rhs-ui/application/status-message-field/options";
import { StatusGlyphIcon } from "@rhs-ui/application/status-message-field/glyphs";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export type { ClearOption, StatusPreset };

/** What the field holds. */
export interface StatusMessageValue {
  /** What the status says. May be empty when there is an icon. */
  text: string;
  /** The name of the icon (`calendar`, `palm-tree`...), or null for none. */
  icon: string | null;
  /** The id of the clear option: when the status should go away by itself. */
  clearAfter: string;
}

/** The words the field uses, for translation. `{time}` and `{name}` are filled in. */
export interface StatusMessageFieldLabels {
  /** The label of the text field. Default "Status". */
  field?: string;
  /** In the empty text field. Default "What are you up to?" */
  placeholder?: string;
  /** The name of the glyph button. Default "Choose a status". */
  presets?: string;
  /** The heading of the menu. Default "Quick statuses". */
  menu?: string;
  /** The menu item that empties the status. Default "Clear status". */
  clear?: string;
  /** The label of the select. Default "Clear after". */
  clearAfter?: string;
  /** The heading of the preview. Default "Preview". */
  preview?: string;
  /** In the preview with nothing set. Default "No status: nothing shows next to your name." */
  none?: string;
  /** After a status that clears at a time. Default "until {time}". */
  until?: string;
  /** After a status that clears at the end of the day. Default "until the end of today". */
  untilToday?: string;
  /** After a status that clears at the end of the week. Default "until the end of the week". */
  untilWeek?: string;
  /** The name of the count under the field. Default "{count} of {max} characters". */
  count?: string;
}

export interface StatusMessageFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The status, when you control it. */
  value?: StatusMessageValue;
  /** The status to start with, when you do not control it. */
  defaultValue?: Partial<StatusMessageValue>;
  /** Called on every change with the status and the moment it clears (an ISO timestamp, worked out from `now` and `timeZone`), or null when it stays. */
  onValueChange?: (value: StatusMessageValue, clearsAt: string | null) => void;
  /** The quick statuses in the menu: text, icon by name and a clear time each. The defaults are In a meeting, Focusing, On holiday, Out sick and Commuting. */
  presets?: readonly StatusPreset[];
  /** The most characters in the text. Default 100. */
  maxLength?: number;
  /** The choices of the select. A choice clears after `minutes`, or at the end of `until` "today" or "week". The defaults are Don't clear, 30 minutes, 1 hour, 4 hours, Today and This week. */
  clearOptions?: readonly ClearOption[];
  /** The moment the clear time is counted from: a Date, a timestamp or an ISO string. Without it, the moment of each change. Pass it for a stable preview and for tests. */
  now?: Date | string | number;
  /** The time zone "Today" and "This week" end in, and the preview is written in. Default "UTC". */
  timeZone?: string;
  /** The language of the clock in the preview. Default "en-US". */
  locale?: string;
  /** Whose name the preview shows the status next to. Default "You". */
  displayName?: string;
  /** The field's name, for a plain form submit: the text goes out as `name`, with `nameIcon` and `nameClearAfter` beside it. */
  name?: string;
  /** Turns the whole field off. */
  disabled?: boolean;
  /** The words the field uses, for translation. */
  labels?: StatusMessageFieldLabels;
}

const DEFAULT_LABELS = {
  field: "Status",
  placeholder: "What are you up to?",
  presets: "Choose a status",
  menu: "Quick statuses",
  clear: "Clear status",
  clearAfter: "Clear after",
  preview: "Preview",
  none: "No status: nothing shows next to your name.",
  until: "until {time}",
  untilToday: "until the end of today",
  untilWeek: "until the end of the week",
  count: "{count} of {max} characters",
} satisfies Required<StatusMessageFieldLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const asTime = (now: Date | string | number): number => (now instanceof Date ? now.getTime() : new Date(now).getTime());

/**
 * Set what you are up to: a short text with an icon, quick statuses such as
 * "In a meeting", and when it should clear itself. The glyph button on the
 * left opens a menu of presets; choosing one fills the text, the icon and its
 * usual clear time, and the focus goes to the text so it can be edited. Under
 * it, "Clear after" is the house Select. The status is previewed the way it
 * will show next to the person's name, with the time it clears. It reports
 * `{ text, icon, clearAfter }` and the moment it clears as an ISO timestamp,
 * worked out from `now` in the time zone you give, so "Today" ends at that
 * zone's midnight. A status of only an icon is allowed. Icons are passed by
 * name, so a status can come straight from a server.
 */
export function StatusMessageField({
  value,
  defaultValue,
  onValueChange,
  presets = DEFAULT_PRESETS,
  maxLength = 100,
  clearOptions = DEFAULT_CLEAR_OPTIONS,
  now,
  timeZone = "UTC",
  locale = "en-US",
  displayName = "You",
  name,
  disabled = false,
  labels,
  className,
  ...props
}: StatusMessageFieldProps) {
  const text: Required<StatusMessageFieldLabels> = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const input = useRef<HTMLInputElement>(null);
  const chosen = useRef(false);
  const [own, setOwn] = useState<StatusMessageValue>({ text: "", icon: null, clearAfter: clearOptions[0]?.id ?? "never", ...defaultValue });
  const current = value ?? own;
  const option = clearOptions.find((item) => item.id === current.clearAfter) ?? clearOptions[0];

  // The preview writes the clear time from the clock of the browser, which the server does not have: it is read after mounting and again whenever the choice changes, so a field left open does not show an old time.
  const [clock, setClock] = useState<number | null>(null);
  useEffect(() => {
    if (now === undefined) setClock(Date.now());
  }, [now, current.clearAfter]);
  const reference = now !== undefined ? asTime(now) : clock;

  function change(patch: Partial<StatusMessageValue>) {
    const next: StatusMessageValue = { ...current, ...patch };
    if (value === undefined) setOwn(next);
    const chosenOption = clearOptions.find((item) => item.id === next.clearAfter) ?? clearOptions[0];
    onValueChange?.(next, resolveClear(chosenOption, now !== undefined ? asTime(now) : Date.now(), timeZone));
  }

  function choosePreset(preset: StatusPreset) {
    chosen.current = true;
    change({ text: preset.text, icon: preset.icon, clearAfter: preset.clearAfter });
  }

  // The preview's tail: when it clears, in words.
  const tail = (() => {
    if (!option || (option.minutes === undefined && option.until === undefined)) return null;
    if (option.until === "today") return text.untilToday;
    if (option.until === "week") return text.untilWeek;
    if (reference === null || option.minutes === undefined) return null;
    const ends = reference + option.minutes * 60_000;
    const sameDay = new Intl.DateTimeFormat("en-CA", { timeZone, dateStyle: "short" }).format(reference) === new Intl.DateTimeFormat("en-CA", { timeZone, dateStyle: "short" }).format(ends);
    const time = new Intl.DateTimeFormat(locale, { timeZone, ...(sameDay ? null : { weekday: "short" }), hour: "numeric", minute: "2-digit" }).format(ends);
    return fill(text.until, { time });
  })();

  const filled = current.text.trim() !== "" || current.icon !== null;
  const near = current.text.length >= maxLength * 0.8;
  const inputId = `${base}-text`;
  const clearId = `${base}-clear`;
  const countId = `${base}-count`;

  return (
    <div data-slot="status-message-field" className={cn("@container grid gap-5", className)} {...props}>
      <div className="grid gap-1.5">
        <Label htmlFor={inputId}>{text.field}</Label>
        {/* The ring is the group's, as it is when the text has the focus: a ring on the button alone is clipped to a square by the divider and reads as another kind of focus. The button itself fills while it is the one that has it. */}
        <InputGroup className={cn("has-[button:focus-visible]:border-ring has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/40", disabled && "opacity-50")}>
          <InputGroupAddon className="px-0">
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={disabled}
                aria-label={text.presets}
                className="grid h-9 w-11 place-items-center rounded-l-[calc(var(--radius-md)-1px)] border-r border-border text-foreground outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted disabled:cursor-not-allowed data-[state=open]:bg-muted motion-reduce:transition-none"
              >
                {current.icon ? <StatusGlyphIcon name={current.icon} className="size-[18px]" /> : <IconSmile aria-hidden="true" className="size-[18px] text-muted-foreground" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-72 max-w-[calc(100vw-2rem)]"
                onCloseAutoFocus={(event) => {
                  // A status that was just chosen is the thing to edit next; closing with Escape gives the focus back to the button as usual.
                  if (!chosen.current) return;
                  chosen.current = false;
                  event.preventDefault();
                  input.current?.focus();
                }}
              >
                <DropdownMenuLabel>{text.menu}</DropdownMenuLabel>
                {presets.map((preset) => (
                  <DropdownMenuItem key={preset.id} onSelect={() => choosePreset(preset)}>
                    <StatusGlyphIcon name={preset.icon} />
                    <span className="min-w-0 flex-1 truncate">{preset.text}</span>
                    <DropdownMenuShortcut className="font-sans tracking-normal">{clearOptions.find((item) => item.id === preset.clearAfter)?.label}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!filled} onSelect={() => change({ text: "", icon: null })}>
                  <IconClose />
                  {text.clear}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroupAddon>
          <InputGroupInput
            ref={input}
            id={inputId}
            name={name}
            value={current.text}
            maxLength={maxLength}
            disabled={disabled}
            placeholder={text.placeholder}
            autoComplete="off"
            aria-describedby={near ? countId : undefined}
            onChange={(event) => change({ text: event.target.value })}
          />
          {near ? (
            <InputGroupAddon className="pl-0 text-xs tabular-nums">
              <span id={countId} aria-label={fill(text.count, { count: String(current.text.length), max: String(maxLength) })} className={cn(current.text.length >= maxLength ? "font-medium text-foreground" : undefined)}>
                {current.text.length}/{maxLength}
              </span>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={clearId}>{text.clearAfter}</Label>
        <Select value={current.clearAfter} onValueChange={(next) => change({ clearAfter: next })} name={name ? `${name}ClearAfter` : undefined} disabled={disabled}>
          <SelectTrigger id={clearId} className="w-full @sm:w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clearOptions.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div role="group" aria-label={text.preview} className="grid gap-1.5">
        <p className="text-xs text-muted-foreground">{text.preview}</p>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <Avatar size="sm" aria-hidden="true" className="shrink-0">
            <AvatarFallback>{initialsOf(displayName) || "?"}</AvatarFallback>
          </Avatar>
          {/* The name, then the status as one run of text: it sits beside the name when it fits and under it when it does not, never indented, and the time it clears follows the words instead of standing in a column of its own. */}
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm leading-snug [overflow-wrap:anywhere]">
            <span className="font-medium">{displayName}</span>{" "}
            {filled ? (
              <span className="min-w-0 text-foreground">
                {current.icon ? <StatusGlyphIcon name={current.icon} className={cn("inline-block size-4 align-[-3px]", current.text.trim() !== "" ? "mr-1.5" : "mr-0.5")} /> : null}
                {current.text.trim()}
                {tail ? (
                  <>
                    {" "}
                    <span className="text-xs whitespace-nowrap text-muted-foreground">{tail}</span>
                  </>
                ) : null}
              </span>
            ) : (
              <span className="min-w-0 text-muted-foreground">{text.none}</span>
            )}
          </p>
        </div>
      </div>

      {name ? <input type="hidden" name={`${name}Icon`} value={current.icon ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
