import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowDown, IconInfo } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface Alumnus {
  /** Identifies the graduate in the list. */
  id: string;
  /** Their name. Also the source of the initials when there is no portrait. */
  name: string;
  /** A portrait. Initials stand in until it loads, and when there is none. */
  photo?: string;
  /** Where they started, in a few words: "Barista". */
  from: string;
  /** What they do now: "Frontend developer". */
  to: string;
  /** Who they work for now: "Northwind". It is set under the role. */
  employer?: string;
  /** How long it took, written as it should be read: "9 months". */
  duration: string;
  /** One sentence in their own words, without quotation marks: the card adds them. */
  quote: string;
}

export interface AlumniOutcomesLabels {
  /** The small label in front of where they started. Default "From". */
  from: string;
  /** The small label in front of where they are now. Default "To". */
  to: string;
  /** What a screen reader hears instead of the "From" label. Default "Before". */
  before: string;
  /** What a screen reader hears instead of the "To" label. Default "After". */
  after: string;
  /** What a screen reader hears before the time it took. Default "Time it took". */
  took: string;
}

export interface AlumniOutcomesProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Two to six graduates, in two columns on a desktop. */
  alumni: readonly Alumnus[];
  /**
   * The disclaimer printed under the list: "Individual results vary". Outcome claims need context, so it is
   * required; pass `null` only when you have checked that nothing needs saying.
   */
  note: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<AlumniOutcomesLabels>;
}

const LABELS: AlumniOutcomesLabels = { from: "From", to: "To", before: "Before", after: "After", took: "Time it took" };

/** The small capitals that name a step of the journey. */
const STEP = "pt-1 text-center text-[0.6875rem] leading-none font-medium tracking-[0.14em] text-muted-foreground uppercase";

/**
 * Before and after stories for courses, bootcamps and coaching: a graduate's portrait and name, where they
 * started, where they work now, and the time it took in between, with one sentence in their own words. The
 * journey is a short rail of three lines (From, the time, To) with an arrow joining them, so the result is
 * the biggest thing on the card. The arrow and the From and To labels are only for the eye: a screen reader
 * hears "Before: Barista", "Time it took: 9 months" and "After: Frontend developer, Northwind". A disclaimer
 * is part of the section and printed under the list, because outcome claims need context. Two columns on a
 * desktop, one on a phone. No state of its own, so it renders on the server.
 */
export function AlumniOutcomes({ title, description, alumni, note, labels, className, ...props }: AlumniOutcomesProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();

  return (
    <section data-slot="alumni-outcomes" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul role="list" className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-2">
        {alumni.map((person) => (
          <li key={person.id}>
            <article className="flex h-full flex-col gap-7 rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-7">
              <header className="flex items-center gap-4">
                {/* Only for the eye: the name is the heading next to it, so the initials are not read. */}
                <Avatar aria-hidden="true" size="lg" className="ring-1 ring-border data-[size=lg]:size-14">
                  {person.photo ? <AvatarImage src={person.photo} alt="" /> : null}
                  <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                </Avatar>
                <h3 className="text-base font-medium tracking-[-0.01em]">{person.name}</h3>
              </header>
              {/* The result, on a quiet panel of its own so it is the first thing the eye finds. */}
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3.5 rounded-xl bg-muted p-5">
                <p aria-hidden="true" className={STEP}>
                  {words.from}
                </p>
                <p className="text-base leading-snug text-muted-foreground">
                  <span className="sr-only">{words.before}: </span>
                  {person.from}
                </p>
                {/* The arrow sits on a rail that reaches into the gaps above and below, so From and To read as one line. Only for the eye. */}
                <span aria-hidden="true" className="relative flex items-center justify-center self-stretch text-muted-foreground">
                  <span className="absolute inset-y-[-0.875rem] left-1/2 w-px -translate-x-1/2 bg-foreground/20" />
                  <IconArrowDown className="relative size-4 bg-muted" />
                </span>
                <p className="flex items-center">
                  <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[0.8125rem] leading-5 font-medium tabular-nums">
                    <span className="sr-only">{words.took}: </span>
                    {person.duration}
                  </span>
                </p>
                <p aria-hidden="true" className={STEP}>
                  {words.to}
                </p>
                <p className="grid text-lg leading-snug font-medium tracking-[-0.02em]">
                  <span>
                    <span className="sr-only">{words.after}: </span>
                    {person.to}
                  </span>
                  {person.employer ? (
                    <>
                      <span className="sr-only">, </span>
                      <span className="text-base font-normal tracking-normal text-muted-foreground">{person.employer}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <blockquote className="mt-auto">
                <p className="text-base leading-relaxed text-pretty">&ldquo;{person.quote}&rdquo;</p>
              </blockquote>
            </article>
          </li>
        ))}
      </ul>
      {note ? (
        <div role="note" className="mx-auto mt-8 flex w-fit max-w-2xl items-start gap-2.5 text-left text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>{note}</div>
        </div>
      ) : null}
    </section>
  );
}
