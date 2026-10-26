import { useId, type ComponentProps, type ReactNode } from "react";

import { IconBookOpen, IconCheck, IconLock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface PaywallPrice {
  /** What it costs. A number is written as money in the section's currency; text ("Free") is shown as written. */
  amount: number | string;
  /** What the price is for, and the way out: "per month, cancel any time". */
  period?: string;
}

export interface PaywallAction {
  /** What the button says: "Start your free month". */
  label: string;
  /** Where the button goes. It is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed, for an offer that opens in a dialog. A function needs a client component around the block. */
  onClick?: () => void;
}

export interface PaywallSignIn {
  /** Where members sign in. */
  href: string;
  /** The text of the link. "Sign in" when left out. */
  label?: string;
}

export interface PaywallGateLabels {
  /** Said before the sign-in link. */
  member: string;
  /** The text of the sign-in link when you do not pass one. */
  signIn: string;
}

const LABELS: PaywallGateLabels = { member: "Already a member?", signIn: "Sign in" };

export interface PaywallGateProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The last visible lines of the article, as real text. They fade into the page; nothing else about the fade is meaningful. */
  teaser: ReactNode;
  /** The headline of the offer: "Keep reading with a free account". */
  title: string;
  /** What the reader gets, a line each. Three read best. */
  benefits: readonly string[];
  /** What it costs and for how long. */
  price: PaywallPrice;
  /** The primary button. */
  action: PaywallAction;
  /** The link for members who are not signed in yet. */
  signIn?: PaywallSignIn;
  /** Why the reader sees the wall, as a sentence: "You have read 3 of 3 free articles this month". */
  remaining?: string;
  /** A small badge above the headline: "Members only". */
  eyebrow?: string;
  /** The ISO 4217 currency of a numeric price. "USD" by default. */
  currency?: string;
  /** The language a numeric price is written in. "en-US" by default. */
  locale?: string;
  /** The level of the headline: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PaywallGateLabels>;
}

/**
 * The subscribe-to-keep-reading moment, placed under the visible paragraphs of an article. The last lines fade into
 * the page with a mask (a functional fade that hides where the preview ends, not decoration) and a card rises over
 * the fade with the offer: a headline, three benefits, the price with its period, the primary button and a sign-in
 * link for members. The fade carries no information: the teaser is ordinary text a screen reader reads in full, and
 * the card has a heading of its own. For publishers and membership sites that meter their content. Mark the article
 * up for search engines too, or the wall can read as cloaking: describe it with JSON-LD that sets
 * isAccessibleForFree to false and a hasPart whose cssSelector matches the gated part of the page (pass a className
 * such as paywall to this block), and send crawlers the same teaser readers see. It needs no client JavaScript.
 */
export function PaywallGate({
  teaser,
  title,
  benefits,
  price,
  action,
  signIn,
  remaining,
  eyebrow,
  currency = "USD",
  locale = "en-US",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: PaywallGateProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  // 4 is shown as $4, not $4.00; a price with cents keeps them.
  const amount =
    typeof price.amount === "number"
      ? new Intl.NumberFormat(locale, { style: "currency", currency, ...(Number.isInteger(price.amount) ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}) }).format(price.amount)
      : price.amount;
  return (
    <section data-slot="paywall-gate" aria-labelledby={`${id}-title`} className={cn("@container mx-auto w-full max-w-2xl break-words", className)} {...props}>
      {/* The mask fades the text to nothing before the card begins. It is visual only: the words are all still there for anything that reads them. */}
      <div className="text-lg leading-relaxed text-pretty [-webkit-mask-image:linear-gradient(to_bottom,#000_10%,transparent_88%)] [mask-image:linear-gradient(to_bottom,#000_10%,transparent_88%)]">{teaser}</div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm @md:p-8">
        {remaining ? (
          <p className="flex items-start gap-2 text-sm leading-snug text-muted-foreground">
            <IconBookOpen aria-hidden="true" className="mt-px size-4 shrink-0" />
            {remaining}
          </p>
        ) : null}
        {eyebrow ? (
          <Badge variant="outline" className={cn(remaining && "mt-5")}>
            <IconLock aria-hidden="true" />
            {eyebrow}
          </Badge>
        ) : null}
        <Heading id={`${id}-title`} className={cn("text-2xl leading-tight font-medium tracking-[-0.03em] text-balance @md:text-3xl", (remaining || eyebrow) && "mt-5")}>
          {title}
        </Heading>

        <ul role="list" className="mt-6 grid gap-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-[0.9375rem] leading-snug">
              <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 text-pretty">{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col gap-5 border-t border-border pt-6 @md:flex-row @md:items-center @md:justify-between">
          <p className="min-w-0">
            <span className="text-3xl leading-none font-medium tracking-[-0.04em] tabular-nums">{amount}</span>
            {price.period ? <span className="mt-1.5 block text-sm leading-snug text-muted-foreground @md:ml-2.5 @md:mt-0 @md:inline">{price.period}</span> : null}
          </p>
          {action.href ? (
            <Button asChild size="lg" className="@md:min-w-48">
              <a href={action.href} onClick={action.onClick}>
                {action.label}
              </a>
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={action.onClick} className="@md:min-w-48">
              {action.label}
            </Button>
          )}
        </div>

        {signIn ? (
          <p className="mt-5 text-sm text-muted-foreground">
            {labels.member}{" "}
            <a
              href={signIn.href}
              className="rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              {signIn.label ?? labels.signIn}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
