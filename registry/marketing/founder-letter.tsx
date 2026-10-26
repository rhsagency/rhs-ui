import { useId, type ComponentProps, type ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface LetterDate {
  /** The date as you want it read: "14 October 2026". */
  label: string;
  /** The same day for machines, as an ISO date: "2026-10-14". */
  dateTime: string;
}

export interface LetterSigner {
  /** Who signs. Set in a heavier weight than the letter. */
  name: string;
  /** Their role, beneath the name: "Founder and head roaster". */
  role?: string;
  /** A portrait URL, drawn as a small circle. Initials stand in until it loads, or if it never does. */
  portrait?: string;
}

export interface FounderLetterLabels {
  /** The words that open the postscript. */
  postscript: string;
}

export interface FounderLetterProps extends Omit<ComponentProps<"article">, "title"> {
  /** The day the letter is dated. Shown with the place, above everything else. */
  date?: LetterDate;
  /** Where it was written from: "Utrecht". */
  place?: string;
  /** A subject line above the salutation: "Why our prices change in January". Optional; a letter reads without one. */
  title?: string;
  /** The level of the title: 2 by default. */
  headingLevel?: 1 | 2 | 3;
  /** Who it is addressed to: "Dear Polder customer,". Set apart from the body in a heavier weight. */
  salutation?: string;
  /** The body: three to six paragraphs. Plain `p`, `ul`, `ol`, `blockquote`, `strong` and `a` elements are styled, so Markdown output works as it is. */
  children: ReactNode;
  /** The words before the signature: "Thank you for staying with us,". */
  signoff?: string;
  /** Who signs, with a role and a small portrait. */
  signer: LetterSigner;
  /** A last paragraph after the signature, in plain inline content. It is always visible; nothing about it is collapsed. */
  postscript?: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FounderLetterLabels>;
}

const LABELS: FounderLetterLabels = { postscript: "P.S." };

/** A link you can tell from the words around it, and bold, wherever the caller's markup lands: the body and the postscript both carry it. */
const INLINE_LINK =
  "[&_a]:rounded-sm [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a]:transition-colors [&_a]:duration-150 [&_a]:motion-reduce:transition-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40 [&_strong]:font-semibold";

// Written out whole, because Tailwind only generates the classes it can read in the source.
const PROSE = [
  "text-[1.0625rem] leading-[1.8] text-pretty sm:text-lg sm:leading-[1.8]",
  "[&>*+*]:mt-5",
  INLINE_LINK,
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:pl-1 [&_li+li]:mt-2",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-foreground [&_blockquote]:pl-5",
].join(" ");

/**
 * A letter from the person behind the company, set so it reads like one: the
 * date and place, a salutation, a few paragraphs in a single narrow column
 * with a generous line height, a sign-off, and the signer's name in a heavier
 * weight with their role beneath and a small portrait. An optional postscript
 * is a paragraph of its own and is never hidden behind a click. There is
 * nothing decorative and no handwriting font, because the words are what
 * earn the trust. For about pages, launch announcements, price-change
 * explanations and apologies, where a company has something to say and a
 * person to say it.
 */
export function FounderLetter({
  date,
  place,
  title,
  headingLevel = 2,
  salutation,
  children,
  signoff,
  signer,
  postscript,
  labels: custom,
  className,
  ...props
}: FounderLetterProps) {
  const labels = { ...LABELS, ...custom };
  const titleId = useId();
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  return (
    <article data-slot="founder-letter" aria-labelledby={title ? titleId : undefined} className={cn("mx-auto w-full max-w-[38rem]", className)} {...props}>
      {date || place ? (
        <p className="text-sm text-muted-foreground">
          {place}
          {place && date ? ", " : null}
          {date ? (
            <time dateTime={date.dateTime} className="tabular-nums">
              {date.label}
            </time>
          ) : null}
        </p>
      ) : null}
      {title ? (
        <Title id={titleId} className={cn("text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl", date || place ? "mt-5" : null)}>
          {title}
        </Title>
      ) : null}
      {salutation ? <p className={cn("text-[1.0625rem] leading-[1.8] font-semibold sm:text-lg", date || place || title ? "mt-10" : null)}>{salutation}</p> : null}
      <div className={cn(PROSE, salutation ? "mt-5" : date || place || title ? "mt-10" : null)}>{children}</div>
      {signoff ? <p className="mt-10 text-[1.0625rem] leading-[1.8] sm:text-lg">{signoff}</p> : null}
      <div className={cn("flex items-center gap-4", signoff ? "mt-4" : "mt-10")}>
        <Avatar size="lg" className="size-14 ring-1 ring-foreground/10">
          {signer.portrait ? <AvatarImage src={signer.portrait} alt="" width={112} height={112} /> : null}
          <AvatarFallback className="text-base">{initialsOf(signer.name)}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 leading-snug">
          <span className="block text-base font-semibold tracking-[-0.01em]">{signer.name}</span>
          {signer.role ? <span className="mt-0.5 block text-sm text-muted-foreground">{signer.role}</span> : null}
        </p>
      </div>
      {postscript ? (
        <p className={cn("mt-10 border-t border-border pt-6 text-[1.0625rem] leading-[1.8] text-pretty sm:text-lg", INLINE_LINK)}>
          <span className="font-semibold">{labels.postscript}</span> {postscript}
        </p>
      ) : null}
    </article>
  );
}
