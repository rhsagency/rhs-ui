"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { IconArrowRight } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface JoinCountAvatar {
  /** The person's name. It gives the initials shown until the picture loads, or when there is none. */
  name: string;
  /** The picture. The face is decorative, so it carries no description. */
  src?: string;
}

export interface JoinCountAction {
  /** The button's text: "Start free". */
  label: string;
  /** Where the button goes. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
}

export interface JoinCountCtaLabels {
  /** The line that dates the figure. {date} stands for the day. */
  asOf: string;
}

const LABELS: JoinCountCtaLabels = { asOf: "as of {date}" };

/** One object for every render: a new one each time would restart the rise. */
const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

export interface JoinCountCtaProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The number of people or teams, as a real, verified count. */
  count: number;
  /** What is counted, after the number: "teams". Write the plural, the form that follows a large number. */
  unit: string;
  /** The line before the number. "Join" by default. */
  lead?: string;
  /** A few faces, five to eight read best. They are decoration: the count is in the text. */
  avatars?: readonly JoinCountAvatar[];
  /** One sentence on what the people get: "Teams that plan their week in Kestrel and have not opened a spreadsheet since." */
  description?: string;
  /** The button. */
  action: JoinCountAction;
  /** A small line under the button: "Free for 14 days. No card needed." */
  note?: string;
  /**
   * The day the count was true: an ISO day ("2026-10-01") or a date. It is printed under the number as
   * "as of 1 October 2026", so the figure is dated. A count without a date ages without anyone noticing.
   */
  asOf?: string | Date;
  /** The language the number and the date are written in. "en-US" by default. */
  locale?: string;
  /** The time zone a full date and time is read in. A plain ISO day is read as that calendar day. "UTC" by default. */
  timeZone?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<JoinCountCtaLabels>;
}

/**
 * A closing ask anchored by a big number: how many people already did it. A short lead-in, the count set very large
 * with what it counts, a stack of faces, one sentence on what they get, the button and a small note. The count is
 * formatted for the locale and, when the band scrolls into view from below, rises once to its value; where it is
 * already on screen when the page loads, or the reader prefers less motion, it simply stands there. The faces are
 * decoration and hidden from assistive technology, and the heading carries the whole figure as text, so the number
 * is the same for everyone. Use a count you can verify, and pass asOf so the figure is dated underneath it.
 */
export function JoinCountCta({ count, unit, lead = "Join", avatars, description, action, note, asOf, locale = "en-US", timeZone = "UTC", headingLevel = 2, labels: custom, className, ...props }: JoinCountCtaProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const counter = useRef<HTMLSpanElement>(null);
  // Starts false, so the server and the browser both print the real count. It turns true only while the figure is just under the screen, where nobody sees it.
  const [low, setLow] = useState(false);

  useEffect(() => {
    const node = counter.current;
    if (!node || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // The figure is only ever lowered on positive evidence that someone is scrolling towards it: it sits just below the screen and the page has
    // moved. A page that is printed, captured or never scrolled keeps the real number, and so does one that is on screen from the start or
    // reached in a single jump: those show the figure as it is, without the rise.
    let scrolled = false;
    const onScroll = () => {
      scrolled = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    const approaching = new IntersectionObserver(
      ([entry]) => {
        if (scrolled && entry?.isIntersecting && entry.boundingClientRect.top > window.innerHeight) setLow(true);
      },
      { rootMargin: "0px 0px 12% 0px" },
    );
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setLow(false);
        approaching.disconnect();
        seen.disconnect();
      },
      { threshold: 0.4 },
    );
    approaching.observe(node);
    seen.observe(node);
    return () => {
      window.removeEventListener("scroll", onScroll);
      approaching.disconnect();
      seen.disconnect();
    };
  }, []);

  // A count is a whole number, and the rise passes through whole numbers only.
  const whole = Math.round(count);
  const total = new Intl.NumberFormat(locale, WHOLE).format(whole);

  let dated: string | null = null;
  let datedAt: string | undefined;
  if (asOf !== undefined) {
    const moment = new Date(asOf);
    const calendarDay = typeof asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asOf);
    if (Number.isNaN(moment.getTime())) dated = String(asOf);
    else {
      dated = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: calendarDay ? "UTC" : timeZone }).format(moment);
      datedAt = calendarDay ? asOf : moment.toISOString();
    }
  }

  const arrow = <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />;

  return (
    <section data-slot="join-count-cta" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="mx-auto flex max-w-4xl flex-col items-center px-2 py-14 text-center @2xl:py-20">
        <Heading id={`${id}-title`} className="flex flex-col items-center">
          <span className="text-lg leading-snug font-medium tracking-[-0.02em] text-muted-foreground @2xl:text-xl">{lead}</span>{" "}
          {/* The figure is written once for everyone, as text. What animates is a copy for the eye, hidden from assistive technology. */}
          <span className="mt-2 flex flex-wrap items-baseline justify-center gap-x-[0.28em] text-[clamp(3.5rem,17cqi,8.5rem)] leading-[0.95] font-medium tracking-[-0.035em] text-balance">
            <span className="sr-only">{total}</span>{" "}
            <span ref={counter} aria-hidden="true">
              <AnimatedNumber value={low ? 0 : whole} duration={low ? 0 : 1.4} locale={locale} format={WHOLE} />
            </span>{" "}
            <span className="text-muted-foreground">{unit}</span>
          </span>
        </Heading>

        {dated ? (
          <p className="mt-4 text-xs text-muted-foreground tabular-nums">
            {labels.asOf.split(/(\{date\})/).map((part, index) => (part === "{date}" ? <time key={index} dateTime={datedAt}>{dated}</time> : part))}
          </p>
        ) : null}

        {avatars?.length ? (
          <AvatarGroup aria-hidden="true" className="mt-8 -space-x-2">
            {/* On a very narrow band only the first five faces are drawn: seven would be wider than the text under them. */}
            {avatars.map((person, index) => (
              <Avatar key={`${index}-${person.name}`} size="lg" className={cn(index >= 5 && "@max-xs:hidden")}>
                {person.src ? <AvatarImage src={person.src} alt="" /> : null}
                <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        ) : null}

        {description ? <p className={cn("max-w-xl text-lg leading-relaxed text-balance text-muted-foreground", avatars?.length ? "mt-6" : "mt-8")}>{description}</p> : null}

        {action.href ? (
          <Button asChild size="lg" className="mt-8">
            <a href={action.href} onClick={action.onClick}>
              {action.label}
              {arrow}
            </a>
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={action.onClick} className="mt-8">
            {action.label}
            {arrow}
          </Button>
        )}
        {note ? <p className="mt-4 text-sm text-muted-foreground">{note}</p> : null}
      </div>
    </section>
  );
}
