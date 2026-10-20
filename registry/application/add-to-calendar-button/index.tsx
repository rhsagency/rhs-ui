"use client";

import { useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCalendarPlus, IconChevronDown, IconDownload, IconExternal } from "@rhs-ui/icons";
import {
  buildGoogleUrl,
  buildIcs,
  buildOutlookUrl,
  describeWhen,
  downloadTextFile,
  icsFileName,
  resolveEvent,
  type CalendarEvent,
  type CalendarProvider,
  type ResolvedEvent,
} from "@rhs-ui/application/add-to-calendar-button/calendar";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface AddToCalendarButtonProps extends Omit<ComponentProps<"div">, "children"> {
  /** The event: title, start, end or durationMinutes, timeZone, location, description, url, allDay. */
  event: CalendarEvent;
  /** Which calendars to offer, in this order. Default: Google, Outlook, Apple and an .ics file. */
  providers?: readonly CalendarProvider[];
  /** Language of the date and time in the menu header. Default "en-US". */
  locale?: string;
  /** The button's text. Default "Add to calendar". */
  label?: string;
  /** Called after a provider is chosen, with which one. The web links and the download start on their own. */
  onAdd?: (provider: CalendarProvider) => void;
  /** Any Button variant. Default "outline". */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
}

const DEFAULT_PROVIDERS: readonly CalendarProvider[] = ["google", "outlook", "apple", "ics"];

/** What each choice is called and what it does, said in words: a link that opens a new tab says so. */
const PROVIDER_INFO: Record<CalendarProvider, { name: string; hint: string; tile: string; external: boolean }> = {
  google: { name: "Google Calendar", hint: "Opens in a new tab", tile: "G", external: true },
  outlook: { name: "Outlook", hint: "Opens in a new tab", tile: "O", external: true },
  apple: { name: "Apple Calendar", hint: "Downloads an .ics file", tile: "A", external: false },
  ics: { name: "Other calendar", hint: "Downloads an .ics file for any app", tile: ".ics", external: false },
};

function Tile({ provider }: { provider: CalendarProvider }) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/60 text-foreground", provider === "ics" ? "font-mono text-[0.625rem] font-medium" : "text-xs font-semibold")}
    >
      {PROVIDER_INFO[provider].tile}
    </span>
  );
}

function ItemText({ provider }: { provider: CalendarProvider }) {
  const info = PROVIDER_INFO[provider];
  return (
    <>
      <Tile provider={provider} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-tight font-medium text-foreground">{info.name}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{info.hint}</span>
      </span>
      {info.external ? <IconExternal className="size-3.5" /> : <IconDownload className="size-3.5" />}
    </>
  );
}

/** The menu's items. Kept apart so the links and the file are only built when the menu is open. */
function ProviderItems({ event, resolved, providers, locale, onAdd }: { event: CalendarEvent; resolved: ResolvedEvent; providers: readonly CalendarProvider[]; locale: string; onAdd?: (provider: CalendarProvider) => void }) {
  const choose = (provider: CalendarProvider) => {
    if (provider === "apple" || provider === "ics") {
      const file = buildIcs(event);
      if (file) downloadTextFile(file, icsFileName(resolved.title), "text/calendar;charset=utf-8");
    }
    onAdd?.(provider);
  };
  const links: Partial<Record<CalendarProvider, string | null>> = { google: buildGoogleUrl(event), outlook: buildOutlookUrl(event) };
  // A provider listed twice is offered once.
  const unique = providers.filter((provider, index) => providers.indexOf(provider) === index);
  return (
    <>
      <DropdownMenuLabel className="px-2 pt-2 pb-2 font-sans text-xs tracking-normal">
        <span className="line-clamp-2 text-sm leading-snug font-medium text-foreground">{resolved.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{describeWhen(resolved, locale)}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {unique.map((provider) => {
        const href = links[provider];
        const itemClass = "gap-3 py-2";
        if (PROVIDER_INFO[provider].external && href) {
          return (
            <DropdownMenuItem key={provider} asChild className={itemClass}>
              <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onAdd?.(provider)}>
                <ItemText provider={provider} />
              </a>
            </DropdownMenuItem>
          );
        }
        return (
          <DropdownMenuItem key={provider} className={itemClass} onSelect={() => choose(provider)}>
            <ItemText provider={provider} />
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

/**
 * A button with a menu that turns one event into every format people need:
 * Google Calendar and Outlook open a prefilled form in a new tab, Apple and a
 * plain .ics file are built in the browser (RFC 5545: escaped text, folded
 * lines, times converted to UTC, a UID that stays the same) and downloaded, with
 * no server involved. The menu header repeats the event with its time zone, so
 * nobody has to guess, and each choice says in words whether it opens a tab or
 * downloads a file. An event that cannot be read disables the button and says
 * why next to it. The builders are exported from calendar.ts for testing.
 */
export function AddToCalendarButton({ event, providers = DEFAULT_PROVIDERS, locale = "en-US", label = "Add to calendar", onAdd, variant = "outline", size, className, ...props }: AddToCalendarButtonProps) {
  const reasonId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [align, setAlign] = useState<"start" | "end">("start");
  const signature = JSON.stringify(event);
  // The event is read again only when its content changes, not when the parent builds a new object with the same content.
  const result = useMemo(() => resolveEvent(event), [signature]);
  const reason: ReactNode = result.ok ? null : result.reason;

  return (
    <div data-slot="add-to-calendar-button" className={cn("inline-flex max-w-full flex-col items-start gap-1.5", className)} {...props}>
      {result.ok ? (
        <DropdownMenu
          // The menu opens toward the middle of the screen: from the left edge of a button on the left, from the right edge of one on the right.
          onOpenChange={(next) => {
            const box = trigger.current?.getBoundingClientRect();
            if (next && box) setAlign(box.left + box.width / 2 > window.innerWidth / 2 ? "end" : "start");
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button ref={trigger} type="button" variant={variant} size={size} className="max-w-full">
              <IconCalendarPlus />
              <span className="truncate">{label}</span>
              <IconChevronDown className="transition-transform duration-200 group-data-[state=open]/button:rotate-180 motion-reduce:transition-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align} collisionPadding={8} className="w-72 max-w-[calc(100vw-2rem)]">
            <ProviderItems event={event} resolved={result.event} providers={providers} locale={locale} onAdd={onAdd} />
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button type="button" variant={variant} size={size} disabled aria-describedby={reasonId} className="max-w-full">
            <IconCalendarPlus />
            <span className="truncate">{label}</span>
            <IconChevronDown />
          </Button>
          <p id={reasonId} className="text-xs text-muted-foreground">
            {reason}
          </p>
        </>
      )}
    </div>
  );
}
