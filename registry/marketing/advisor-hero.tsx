import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight, IconCheck, IconCheckCircle, IconPhone } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface AdvisorPortrait {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** Who is in it and what they look like: "Maren de Wit, in a dark blazer, smiling at the camera". A portrait is content, so it needs a real alt. */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. Four by five is the design. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the real one loads. */
  blurDataUrl?: string;
}

export interface AdvisorCredential {
  /** An icon from @rhs-ui/icons, as an element: <IconAward />. A check mark is used when you leave it out. It decorates; the label says it. */
  icon?: ReactNode;
  /** One fact: "18 years in practice", "Certified tax adviser", "Dutch, English and German". */
  label: string;
}

export interface AdvisorNextSlot {
  /** A machine-readable moment for the time element: "2026-11-05T10:00". */
  dateTime: string;
  /** The same moment as it should read: "Thursday 10:00". */
  label: string;
}

export interface AdvisorQuote {
  /** One line from a client. */
  text: string;
  /** Who said it: "Noor Bakker, founder of Polder Foods". */
  author: string;
}

export interface AdvisorHeroLabels {
  /** The words in front of the next free time: "Next free slot". */
  nextSlot: string;
  /** The words in front of the phone number: "Prefer to talk first?". */
  phone: string;
}

export interface AdvisorHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The name's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The advisor's name. It is the heading: the person comes first. */
  name: string;
  /** What they are: "Tax lawyer and partner at Kestrel & Vos". */
  role: string;
  /** The portrait, shown large at four by five. */
  portrait: AdvisorPortrait;
  /** A short status in a pill over the portrait: "Accepting new clients". It says it in words with an icon, so it carries no colour of its own. Leave it out for none. */
  availability?: string;
  /** One sentence on what changes for the client. */
  promise: string;
  /** Three facts that earn trust, each with an icon: years in practice, certifications, languages. */
  credentials: readonly AdvisorCredential[];
  /** The one thing the page asks for: "Book a 30-minute intro call". A link to your booking page. */
  cta: { label: string; href: string };
  /** The next free time, as text with a time element under the button. Leave it out when you do not know it. */
  nextSlot?: AdvisorNextSlot;
  /** A number to call instead, as people read it: "020 555 0138". A quiet tel: link beside the button, not a second button. */
  phone?: string;
  /** One line from a client, under the credentials. */
  quote?: AdvisorQuote;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<AdvisorHeroLabels>;
}

const LABELS: AdvisorHeroLabels = {
  nextSlot: "Next free slot",
  phone: "Prefer to talk first?",
};

/** "+31 (0)20 555 0138" -> "+31205550138": what a tel: link wants. */
const telOf = (phone: string) => phone.replace(/\(0\)/g, "").replace(/[^\d+]/g, "");

/**
 * The opening for a consultant, lawyer, coach or any adviser whose product is
 * trust: a large four-by-five portrait with a real alt text, then the name as
 * the heading, the role, one sentence on what changes for the client and three
 * credentials with an icon each, so the person is the first thing read. The
 * page asks for exactly one thing, a booking link, with the next free time
 * under it as text in a time element, a phone number as a quiet link beside
 * it, and one line from a client below. A pill over the portrait can say whether
 * the adviser is taking clients. Nothing else competes with the person: no
 * carousel, no second button.
 */
export function AdvisorHero({ titleAs: Title = "h2", name, role, portrait, availability, promise, credentials, cta, nextSlot, phone, quote, labels, className, ...props }: AdvisorHeroProps) {
  const words = { ...LABELS, ...labels };

  return (
    <section
      data-slot="advisor-hero"
      className={cn(
        // On a tablet the portrait sits level with the name, not centred against a column twice its height; from lg the two columns are about as tall and centre again.
        "grid grid-cols-1 items-center gap-10 py-14 sm:py-20 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-start md:gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center lg:gap-20",
        className,
      )}
      {...props}
    >
      <div data-slot="advisor-hero-portrait" className="relative aspect-[4/5] w-full max-w-md justify-self-start overflow-hidden rounded-2xl border border-border bg-muted max-lg:max-w-sm">
        {portrait.blurDataUrl ? <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${portrait.blurDataUrl}")` }} /> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the portrait is any URL or data URI */}
        <img
          src={portrait.src}
          alt={portrait.alt}
          width={portrait.width}
          height={portrait.height}
          srcSet={portrait.srcSet}
          sizes={portrait.sizes ?? "(min-width: 1024px) 26rem, (min-width: 640px) 24rem, 100vw"}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        {availability ? (
          <Badge variant="outline" className="absolute bottom-4 left-4 h-7 gap-1.5 border-border bg-background px-3 text-[0.8125rem] text-foreground shadow-xs [&>svg]:size-3.5">
            <IconCheckCircle />
            {availability}
          </Badge>
        ) : null}
      </div>

      <div className="min-w-0">
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{name}</Title>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">{role}</p>
        <p className="mt-7 max-w-xl text-xl leading-snug font-medium tracking-[-0.02em] text-pretty sm:text-2xl">{promise}</p>

        {credentials.length ? (
          <ul className="mt-8 grid gap-3.5">
            {credentials.map((credential) => (
              <li key={credential.label} className="flex items-center gap-3.5 text-base">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground [&_svg]:size-[18px]">
                  {credential.icon ?? <IconCheck />}
                </span>
                {credential.label}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            {/* The one thing the page asks for must survive a longer label in another language: it grows to a second line instead of being cut off. */}
            <Button asChild size="lg" className="h-auto min-h-12 max-w-full px-7 py-[0.6875rem] text-center text-base whitespace-normal text-balance max-sm:w-full">
              <a href={cta.href}>
                {cta.label}
                <IconArrowRight className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
              </a>
            </Button>
            {phone ? (
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                {words.phone}
                <a
                  href={`tel:${telOf(phone)}`}
                  className="inline-flex items-center gap-1.5 rounded-sm font-medium whitespace-nowrap text-foreground tabular-nums underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  <IconPhone className="size-3.5" />
                  {phone}
                </a>
              </p>
            ) : null}
          </div>
          {nextSlot ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {words.nextSlot}:{" "}
              <time dateTime={nextSlot.dateTime} className="font-medium text-foreground">
                {nextSlot.label}
              </time>
            </p>
          ) : null}
        </div>

        {quote ? (
          <figure className="mt-10 max-w-xl border-l-2 border-foreground/25 pl-5">
            <blockquote className="text-base leading-relaxed text-pretty text-foreground">&ldquo;{quote.text}&rdquo;</blockquote>
            <figcaption className="mt-2 text-sm text-muted-foreground">{quote.author}</figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
