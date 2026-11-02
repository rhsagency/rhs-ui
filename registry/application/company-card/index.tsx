"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactElement, type ReactNode } from "react";

import { ageText, dateIn, fill, hostOf, type DateInput } from "@rhs-ui/application/company-card/format";
import { IconCheck, IconCircle, IconCircleDot, IconClose, IconExternal } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/** Where the company stands with you. Each has its own word, glyph and weight, so none depends on colour. */
export type CompanyStatus = "lead" | "prospect" | "customer" | "lost";

/** The person who looks after the account. */
export interface CompanyOwner {
  /** Their name: "Pieter de Wit". */
  name: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  image?: string;
}

/** The words the card uses, for translation. `{count}` is filled in. */
export interface CompanyCardLabels {
  /** The label of the industry. Default "Industry". */
  industry?: string;
  /** The label of the size. Default "Size". */
  size?: string;
  /** The label of the place. Default "Location". */
  location?: string;
  /** The label of the person who looks after the account. Default "Owner". */
  owner?: string;
  /** The label of the last contact. Default "Last contact". */
  lastContact?: string;
  /** A number of employees, when `size` is a number. Default "{count} employees". */
  employees?: string;
  /** What `lastContact={null}` says. Default "Not contacted yet". */
  noContact?: string;
  /** Read after the domain link, so nobody is surprised by a new tab. Default "opens in a new tab". */
  newTab?: string;
  /** What a time under a minute old is called. Default "just now". */
  justNow?: string;
  /** The words of the status badge. */
  statuses?: Partial<Record<CompanyStatus, string>>;
}

export interface CompanyCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The company's name: "Halcyon Freight". It is the one link of the card. */
  name: string;
  /** The logo, as an image address. Without one, or while it loads, the card shows the initials of the name. */
  logo?: string;
  /** Its website, with or without the scheme: "halcyon-freight.com". Shown as written without the scheme and the path, and linked in a new tab. */
  domain?: string;
  /** What it does: "Freight and logistics". */
  industry?: string;
  /** How big it is: a number of employees (written "240 employees") or your own words ("51 to 200 people"). */
  size?: string | number;
  /** Where it is: "Rotterdam, Netherlands". */
  location?: string;
  /** Who looks after the account. */
  owner?: CompanyOwner;
  /** When you last spoke: a Date, a timestamp or an ISO string. `null` says it has not happened yet; leave it out to show no line. */
  lastContact?: DateInput | null;
  /** Where the relationship stands: a badge with a glyph and a word. */
  status?: CompanyStatus;
  /** The company's page. The name becomes a link and the whole card opens it. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the name becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment the last contact is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates and numbers. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are counted, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: CompanyCardLabels;
}

const DEFAULT_LABELS = {
  industry: "Industry",
  size: "Size",
  location: "Location",
  owner: "Owner",
  lastContact: "Last contact",
  employees: "{count} employees",
  noContact: "Not contacted yet",
  newTab: "opens in a new tab",
  justNow: "just now",
};

const DEFAULT_STATUSES: Record<CompanyStatus, string> = { lead: "Lead", prospect: "Prospect", customer: "Customer", lost: "Lost" };

function definitions(words: Record<CompanyStatus, string>): Record<CompanyStatus, StatusDefinition> {
  return {
    lead: { label: words.lead, glyph: <IconCircle />, emphasis: "outline", className: "border-dashed" },
    prospect: { label: words.prospect, glyph: <IconCircleDot />, emphasis: "outline" },
    customer: { label: words.customer, glyph: <IconCheck />, emphasis: "strong" },
    lost: { label: words.lost, glyph: <IconClose />, emphasis: "quiet" },
  };
}

/** The browser's clock, once the page is live and then every minute while it is needed. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, needed: boolean): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined && !Number.isNaN(new Date(fixed).getTime());
  useEffect(() => {
    if (pinned || !needed) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned, needed]);
  return pinned ? new Date(fixed as DateInput).getTime() : tick;
}

/**
 * A time with its exact moment in a tooltip. Radix opens a tooltip on hover
 * and keyboard focus only and closes it on every click, so on a touch screen
 * the exact time would never show: here a press toggles it, and hover works
 * as it does in every tooltip. The exact time is also in the text, for
 * screen readers.
 */
function Exact({ at, text, exact }: { at: number; text: string; exact: string }): ReactElement {
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);
  const pressing = useRef(false);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        // The trigger closes its own tooltip on every click; while a press is toggling it, that close is not wanted.
        if (!next && pressing.current) return;
        setOpen(next);
      }}
    >
      <TooltipTrigger
        asChild
        onPointerDown={() => {
          wasOpen.current = open;
        }}
        onClick={() => {
          pressing.current = true;
          setOpen(!wasOpen.current);
          queueMicrotask(() => {
            pressing.current = false;
          });
        }}
      >
        <time dateTime={new Date(at).toISOString()} className="relative z-10 cursor-default tabular-nums decoration-muted-foreground/50 decoration-dotted underline-offset-4 hover:underline [@media(hover:none)]:cursor-pointer">
          {text}
          <span className="sr-only">{`, ${exact}`}</span>
        </time>
      </TooltipTrigger>
      <TooltipContent collisionPadding={8} className="tabular-nums">
        {exact}
      </TooltipContent>
    </Tooltip>
  );
}

/** What stretches the name's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * A company at a glance, for a CRM or a directory: its logo (the initials of
 * the name when there is none), the name as the card's one link, the domain
 * as a second, external link that says it opens a new tab, a status badge
 * with its own glyph and word, and the facts as a real definition list:
 * industry, size, place, owner and when you last spoke, written in words
 * with the exact date in a tooltip. Facts you do not pass leave no empty
 * row. The whole card opens the company; the domain stays a separate target
 * above it.
 */
export function CompanyCard({
  name,
  logo,
  domain,
  industry,
  size,
  location,
  owner,
  lastContact,
  status,
  href,
  onOpen,
  headingLevel = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: CompanyCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const statuses = definitions({ ...DEFAULT_STATUSES, ...labels?.statuses });
  const nameId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const contacted = lastContact === undefined || lastContact === null ? Number.NaN : new Date(lastContact).getTime();
  const clock = useNow(now, !Number.isNaN(contacted));
  const host = domain ? hostOf(domain) : "";

  const sizeText = typeof size === "number" ? fill(text.employees, { count: new Intl.NumberFormat(locale).format(size) }) : size;
  const exact = Number.isNaN(contacted) ? "" : dateIn(contacted, locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  // Before the clock is known the server and the first paint write the date, never a guess at "ago".
  const when = Number.isNaN(contacted) ? "" : clock === null ? dateIn(contacted, locale, timeZone, { day: "numeric", month: "short", year: "numeric" }) : ageText(contacted, clock, locale, timeZone, text.justNow);

  const facts: { key: string; label: string; value: ReactNode }[] = [];
  if (industry) facts.push({ key: "industry", label: text.industry, value: industry });
  if (sizeText) facts.push({ key: "size", label: text.size, value: sizeText });
  if (location) facts.push({ key: "location", label: text.location, value: location });
  if (owner) {
    facts.push({
      key: "owner",
      label: text.owner,
      value: (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar size="sm" className="data-[size=sm]:size-6">
            {owner.image ? <AvatarImage src={owner.image} alt="" /> : null}
            <AvatarFallback className="text-[0.625rem]">{initialsOf(owner.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 [overflow-wrap:anywhere]">{owner.name}</span>
        </span>
      ),
    });
  }
  if (lastContact === null) facts.push({ key: "last", label: text.lastContact, value: <span className="text-muted-foreground">{text.noContact}</span> });
  else if (!Number.isNaN(contacted)) facts.push({ key: "last", label: text.lastContact, value: <Exact at={contacted} text={when} exact={exact} /> });

  const title = <span className="[overflow-wrap:anywhere]">{name}</span>;

  return (
    <TooltipProvider delayDuration={200}>
      <article
        data-slot="company-card"
        data-status={status}
        aria-labelledby={nameId}
        className={cn(
          "group/company-card @container relative flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
          "has-[[data-slot=company-card-open]:focus-visible]:border-ring has-[[data-slot=company-card-open]:focus-visible]:ring-[3px] has-[[data-slot=company-card-open]:focus-visible]:ring-ring/40",
          (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
          className,
        )}
        {...props}
      >
        <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-3.5 gap-y-2 @sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
          <Avatar size="lg" className="size-12 rounded-lg border border-border bg-background">
            {logo ? <AvatarImage src={logo} alt="" className="object-contain p-1.5" /> : null}
            <AvatarFallback className="rounded-lg bg-muted text-sm font-semibold tracking-[-0.02em]">{initialsOf(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Heading id={nameId} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">
              {href ? (
                <a data-slot="company-card-open" href={href} onClick={onOpen} className={OPEN}>
                  {title}
                </a>
              ) : onOpen ? (
                <button data-slot="company-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                  {title}
                </button>
              ) : (
                title
              )}
            </Heading>
            {host ? (
              <a
                href={`https://${host}`}
                target="_blank"
                rel="noopener noreferrer"
                // 24px tall (WCAG 2.5.8) without moving anything: the old 2px top margin is now height above the text, and 2px below it are taken back from the margin.
                className="relative z-10 -mb-0.5 inline-flex min-h-6 max-w-full items-center gap-1 rounded-sm text-[0.8125rem] leading-5 text-muted-foreground underline decoration-border underline-offset-4 outline-none hover:text-foreground hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className="truncate">{host}</span>
                <IconExternal className="size-3.5 shrink-0" />
                <span className="sr-only">({text.newTab})</span>
              </a>
            ) : null}
          </div>
          {status ? <StatusBadge status={status} statuses={statuses} size="md" className="col-start-2 justify-self-start @sm:col-start-3 @sm:row-start-1" /> : null}
        </div>

        {facts.length ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-border pt-4 text-sm">
            {facts.map((fact) => (
              <div key={fact.key} className={cn("min-w-0", fact.key === "last" && facts.length % 2 === 1 && "col-span-2")}>
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 leading-5 font-medium [overflow-wrap:anywhere]">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </article>
    </TooltipProvider>
  );
}
