"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconClose, IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface QuoteCustomer {
  /** Identifies the customer in the wall. */
  id: string;
  /** The company's name. It names the button for screen readers, so it is always real text. */
  name: string;
  /** Their mark as an SVG or an image, drawn about 28px tall in the text colour. Without one the name is set as text. */
  mark?: ReactNode;
  /** What they said, without quotation marks: the panel adds them. Keep it to a sentence or two. */
  quote: string;
  /** Who said it. */
  person: string;
  /** Their job: "Head of operations". The company is already the heading of the panel. */
  role?: string;
  /** The outcome in a few words: "41 percent fewer support tickets". */
  result?: string;
  /** The full story. When set, the result line gets a link to it. */
  href?: string;
}

export interface LogoQuotePopoversLabels {
  /** The name of a mark's button; `{name}` is filled in. Default "{name}: read what they said". */
  trigger: string;
  /** The name of the open panel; `{name}` is filled in. Default "What {name} said". */
  panel: string;
  /** The name of the button that closes the panel. Default "Close". */
  close: string;
  /** The link to the story. Default "Read the story". */
  readStory: string;
}

export interface LogoQuotePopoversProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. Say that the marks open: "Select a logo to read what they said." */
  description?: string;
  /** Four to twelve customers, in a grid of marks. */
  customers: readonly QuoteCustomer[];
  /** The customer whose panel is open, by id, or `null` for none. Pass it with `onOpenChange` to control the wall; leave it out and the wall keeps track itself. */
  openId?: string | null;
  /** The customer whose panel is open to begin with, for a wall that keeps track itself: a preview that shows a quote already open. A panel that starts open does not take focus. */
  defaultOpenId?: string | null;
  /** Called with the id of the panel that opened, or `null` when the open one closed, for analytics or to keep the state yourself. */
  onOpenChange?: (id: string | null) => void;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<LogoQuotePopoversLabels>;
}

const LABELS: LogoQuotePopoversLabels = {
  trigger: "{name}: read what they said",
  panel: "What {name} said",
  close: "Close",
  readStory: "Read the story",
};

/** A template with `{name}` holes, filled in. */
const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (hole, name: string) => values[name] ?? hole);

/** Every mark is drawn at one height, whatever shape it comes in; the width follows. */
const MARK = "inline-flex h-7 items-center [&_img]:h-7 [&_img]:w-auto [&_img]:max-w-full [&_svg]:h-7 [&_svg]:w-auto [&_svg]:max-w-full";

/**
 * A logo wall that answers "what did they say?" without leaving the row. Every customer mark is a button;
 * pressing it opens a small panel anchored to it with a short quote, the person, their role and, when there
 * is one, a result line that links to the story. Marks rest in the muted text colour and the open one comes to
 * full strength with `aria-expanded`. Only one panel is open at a time; Escape or the close button shuts it and
 * focus goes back to the mark. Because it opens on press and not on hover, it works on touch and for keyboard
 * users, which a hover card does not, and a small plus in every cell says the mark opens. When a panel
 * opens, focus moves to the panel, which is named for the customer. Which panel is open is state you can own
 * (`openId` and `onOpenChange`) or start (`defaultOpenId`), so a preview can show a quote already open.
 */
export function LogoQuotePopovers({ title, description, customers, openId: openIdProp, defaultOpenId = null, onOpenChange, labels, className, ...props }: LogoQuotePopoversProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();
  const [ownId, setOwnId] = useState<string | null>(defaultOpenId);
  const controlled = openIdProp !== undefined;
  const openId = controlled ? openIdProp : ownId;
  // The panel that is open as far as the last event knows. Two events can follow each other before a render, so the second reads this and not the value of the render before it.
  const latest = useRef(openId);
  useEffect(() => {
    latest.current = openId;
  });
  // The panel a person asked to open, until it takes focus: a panel that is open to begin with, or that the page opened, leaves focus where it is.
  const asked = useRef<string | null>(null);

  /** A person opened a panel, or closed the open one (Escape, the close button, a press outside). */
  function request(id: string, open: boolean) {
    const current = latest.current;
    // A close only counts for the panel that is open: a press outside one panel can arrive after the press that opens the next.
    const next = open ? id : current === id ? null : current;
    if (next === current) return;
    // A wall that is controlled shows what the page says, not what was asked for, so only its own state is written here.
    if (!controlled) {
      latest.current = next;
      setOwnId(next);
    }
    onOpenChange?.(next);
  }

  return (
    <section data-slot="logo-quote-popovers" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      {/* The rows are pushed a hairline out of their frame on the right and below, so every cell owns its right and bottom rule; the cells of a short last row grow to fill it. */}
      <div className="mt-12 overflow-hidden rounded-2xl border border-border sm:mt-16">
        <ul role="list" className="-mr-px -mb-px flex flex-wrap">
          {customers.map((customer) => (
            <li key={customer.id} className="min-w-0 grow basis-1/2 border-r border-b border-border sm:basis-1/3 lg:basis-1/4">
              <Popover
                open={openId === customer.id}
                onOpenChange={(open) => {
                  if (open) asked.current = customer.id;
                  request(customer.id, open);
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={fill(words.trigger, { name: customer.name })}
                    className="group/logo relative flex h-28 w-full items-center justify-center px-6 text-foreground/55 outline-none transition-colors duration-200 hover:bg-muted/50 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset aria-expanded:bg-muted/60 aria-expanded:text-foreground motion-reduce:transition-none"
                  >
                    {customer.mark ? (
                      <span aria-hidden="true" className={MARK}>
                        {customer.mark}
                      </span>
                    ) : (
                      <span aria-hidden="true" className="text-lg font-semibold tracking-[-0.02em]">
                        {customer.name}
                      </span>
                    )}
                    {/* A plus says "this opens"; it turns into a cross while the panel is open. */}
                    <IconPlus
                      aria-hidden="true"
                      className="absolute top-3 right-3 size-4 text-muted-foreground/70 transition-[color,transform] duration-200 group-hover/logo:text-foreground group-aria-expanded/logo:rotate-45 group-aria-expanded/logo:text-foreground motion-reduce:transition-none"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="center"
                  collisionPadding={16}
                  aria-label={fill(words.panel, { name: customer.name })}
                  // Focus lands on the panel itself, which is named, so a screen reader announces who is speaking before anything else. Only for a panel a person opened.
                  onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    if (asked.current === customer.id) (event.currentTarget as HTMLElement | null)?.focus();
                    asked.current = null;
                  }}
                  // Focus goes back to the mark when it was in the panel and went with it. A panel that the page closed from elsewhere does not take focus from where it is.
                  onCloseAutoFocus={(event) => {
                    const active = document.activeElement;
                    if (active && active !== document.body) event.preventDefault();
                  }}
                  className="w-[min(22rem,calc(100vw-2rem))] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{customer.name}</p>
                    <PopoverClose asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={words.close} className="-mt-1.5 -mr-2 shrink-0">
                        <IconClose />
                      </Button>
                    </PopoverClose>
                  </div>
                  <figure className="mt-3 grid gap-4">
                    <blockquote>
                      <p className="text-[0.9375rem] leading-relaxed text-pretty">&ldquo;{customer.quote}&rdquo;</p>
                    </blockquote>
                    <figcaption className="text-sm leading-snug">
                      <cite className="font-medium not-italic">{customer.person}</cite>
                      {customer.role ? <span className="mt-0.5 block text-muted-foreground">{customer.role}</span> : null}
                    </figcaption>
                  </figure>
                  {customer.result || customer.href ? (
                    <div className="mt-4 grid justify-items-start gap-2 border-t border-border pt-4 text-sm">
                      {customer.result ? <p className="leading-snug font-medium text-pretty tabular-nums">{customer.result}</p> : null}
                      {customer.href ? (
                        <a
                          href={customer.href}
                          className="group/story inline-flex items-center gap-1.5 rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                        >
                          {words.readStory}
                          <IconArrowRight aria-hidden="true" className="size-4 transition-transform duration-150 motion-safe:group-hover/story:translate-x-0.5 motion-reduce:transition-none" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
