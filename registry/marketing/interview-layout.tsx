import { Fragment, type ComponentProps, type ReactNode } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { PullQuote } from "@rhs-ui/primitives/pull-quote";
import { cn } from "@/lib/utils";

export interface InterviewLink {
  /** The link text: "Website", "Latest book". */
  label: string;
  href: string;
}

export interface InterviewGuest {
  /** The guest's name. */
  name: string;
  /** Who they are in a few words: "Founder, Polder Coffee Roasters". */
  role?: string;
  /** A portrait URL, drawn as a small circle. Initials stand in until it loads, or if it never does. */
  portrait?: string;
  /** A line or two about them: what they do and why you should listen. */
  about?: string;
  /** Where to find them. They open in a new tab. */
  links?: readonly InterviewLink[];
}

export interface InterviewQuote {
  /** The line, lifted from the answer. */
  text: string;
  /** Who said it. The guest by default. */
  speaker?: string;
}

export interface InterviewExchange {
  /** The question, as it was asked. Set in strong type. */
  question: string;
  /** The answer. A string is one paragraph, an array is one paragraph per entry, and anything else is rendered as you give it. */
  answer: ReactNode | readonly ReactNode[];
  /** A line worth pulling out, set large after the answer. A string is attributed to the guest. */
  quote?: string | InterviewQuote;
}

export interface InterviewDate {
  /** The date as you want it read: "14 October 2026". */
  label: string;
  /** The same day for machines, as an ISO date: "2026-10-14". */
  dateTime: string;
}

export interface InterviewLayoutLabels {
  /** The small label above the guest's name. */
  guest: string;
  /** The words before the interviewer's name. */
  interviewedBy: string;
  /** Read out after a link that opens in a new tab. */
  newTab: string;
}

export interface InterviewLayoutProps extends Omit<ComponentProps<"article">, "title"> {
  /** A small line above the title: "Interview". */
  eyebrow?: string;
  /** The headline: "Marit Bosch on roasting slowly". */
  title?: string;
  /** The level of the title: 2 by default. Each question sits one level below it. */
  headingLevel?: 1 | 2 | 3;
  /** The guest, who gets a card beside the questions: sticky on wide screens, above the first question on a phone. */
  guest: InterviewGuest;
  /** The opening paragraph: who the guest is and why this conversation. */
  intro?: ReactNode;
  /** The questions and answers, in order. Each is one item of an ordered list. */
  exchanges: readonly InterviewExchange[];
  /** Who asked the questions. */
  interviewer?: string;
  /** When the interview ran. */
  date?: InterviewDate;
  /** "12 min read". */
  readingTime?: string;
  /** Whatever follows the last answer: a closing note, a link to the guest's work. */
  children?: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<InterviewLayoutLabels>;
}

const LABELS: InterviewLayoutLabels = { guest: "The guest", interviewedBy: "Interview by", newTab: "(opens in a new tab)" };

/** A link you can tell from the words around it, and bold, for the markup a caller puts in `intro`. The intro is set in the muted colour, so a link or a strong word in it steps up to the full one. Written out whole, because Tailwind only generates the classes it can read in the source. */
const INTRO_MARKUP =
  "[&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a]:transition-colors [&_a]:duration-150 [&_a]:motion-reduce:transition-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40 [&_strong]:font-semibold [&_strong]:text-foreground";

/** An answer as paragraphs when it is plain text, so a string or a list of strings needs no markup from the caller. */
function Answer({ answer }: { answer: ReactNode | readonly ReactNode[] }) {
  if (typeof answer === "string") return <p>{answer}</p>;
  if (Array.isArray(answer)) {
    return (
      <>
        {answer.map((paragraph: ReactNode, index: number) => (
          <p key={index}>{paragraph}</p>
        ))}
      </>
    );
  }
  return <>{answer}</>;
}

/**
 * A Q&A article: questions set apart from answers in strong foreground type,
 * each exchange an item of an ordered list and each question a heading, so
 * the structure survives assistive technology and a reader can jump from
 * question to question. A card introduces the guest with a portrait, role, a
 * line about them and links; it stays in view beside the questions on wide
 * screens and sits above the first question on a phone. An exchange may carry
 * a pull quote, set large after its answer with the speaker named. For founder
 * stories, customer interviews and expert Q&As.
 */
export function InterviewLayout({ eyebrow, title, headingLevel = 2, guest, intro, exchanges, interviewer, date, readingTime, children, labels: custom, className, ...props }: InterviewLayoutProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Question = `h${headingLevel + 1}` as "h2" | "h3" | "h4";
  const byline = [
    interviewer ? (
      <span key="by">
        {labels.interviewedBy} <span className="font-medium text-foreground">{interviewer}</span>
      </span>
    ) : null,
    date ? (
      <time key="date" dateTime={date.dateTime} className="tabular-nums">
        {date.label}
      </time>
    ) : null,
    readingTime ? (
      <span key="time" className="tabular-nums">
        {readingTime}
      </span>
    ) : null,
  ].filter(Boolean);

  return (
    <article data-slot="interview-layout" className={cn("grid w-full grid-cols-1 gap-x-16 gap-y-10 break-words lg:grid-cols-[minmax(0,38rem)_17rem] lg:justify-center", className)} {...props}>
      <header className="min-w-0 lg:col-start-1 lg:row-start-1">
        {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        {title ? <Title className="max-w-[38rem] text-4xl leading-[1.06] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
        {intro ? <div className={cn("max-w-[38rem] text-lg leading-relaxed text-pretty text-muted-foreground sm:text-xl", INTRO_MARKUP, title || eyebrow ? "mt-5" : null)}>{intro}</div> : null}
        {byline.length ? (
          // On a phone each fact has its own line, so a separator never ends one; from 640px they run together with a dot between them.
          <p className="mt-6 flex flex-col gap-y-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
            {byline.map((item, index) => (
              <Fragment key={index}>
                {index > 0 ? (
                  <span aria-hidden="true" className="max-sm:hidden">
                    &middot;
                  </span>
                ) : null}
                {item}
              </Fragment>
            ))}
          </p>
        ) : null}
      </header>

      <aside aria-label={`${labels.guest}: ${guest.name}`} className="min-w-0 max-w-[38rem] lg:sticky lg:top-[var(--sticky-top,6rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-start">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.guest}</p>
          <div className="mt-4 flex items-center gap-3.5">
            <Avatar size="lg" className="size-14 ring-1 ring-foreground/10">
              {guest.portrait ? <AvatarImage src={guest.portrait} alt="" width={112} height={112} /> : null}
              <AvatarFallback className="text-base">{initialsOf(guest.name)}</AvatarFallback>
            </Avatar>
            <p className="min-w-0 leading-snug">
              <span className="block text-base font-semibold tracking-[-0.01em]">{guest.name}</span>
              {guest.role ? <span className="mt-0.5 block text-sm text-muted-foreground">{guest.role}</span> : null}
            </p>
          </div>
          {guest.about ? <p className="mt-4 text-sm leading-relaxed text-pretty text-muted-foreground">{guest.about}</p> : null}
          {guest.links?.length ? (
            <ul role="list" className="mt-4 grid gap-2 border-t border-border pt-4">
              {guest.links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                  >
                    {link.label}
                    <IconArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                    <span className="sr-only"> {labels.newTab}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 max-w-[38rem] border-t border-border pt-8 sm:pt-10 lg:col-start-1 lg:row-start-2">
        <ol role="list" className="max-w-[38rem] [&>li+li]:mt-12">
          {exchanges.map((exchange) => {
            const quote = typeof exchange.quote === "string" ? { text: exchange.quote } : exchange.quote;
            return (
              <li key={exchange.question}>
                <Question className="text-xl leading-snug font-semibold tracking-[-0.02em] text-balance sm:text-2xl">{exchange.question}</Question>
                <div className="mt-4 text-[1.0625rem] leading-[1.75] text-pretty text-foreground/85 sm:text-lg sm:leading-[1.75] [&>*+*]:mt-4 [&_a]:rounded-sm [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40 [&_strong]:font-semibold [&_strong]:text-foreground">
                  <Answer answer={exchange.answer} />
                </div>
                {quote ? <PullQuote align="left" quote={quote.text} cite={quote.speaker ?? guest.name} source={quote.speaker ? undefined : guest.role} className="mt-10 mb-0" /> : null}
              </li>
            );
          })}
        </ol>
        {children ? <div className="mt-14 max-w-[38rem]">{children}</div> : null}
      </div>
    </article>
  );
}
