import type { ComponentProps, ReactNode } from "react";

import { describeSnippet, SnippetCard, type Snippet } from "@rhs-ui/marketing/ui-snippets-hero/cards";
import { cn } from "@/lib/utils";

export type { ActivitySnippet, CommentSnippet, Snippet, SnippetPerson, StatusSnippet, TaskSnippet } from "@rhs-ui/marketing/ui-snippets-hero/cards";

export interface UiSnippetsHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** A short label above the title: "Now with shared views". */
  eyebrow?: string;
  /** The promise, in a line or two. */
  title: string;
  /** One line under the title. */
  description?: string;
  /** Two actions: the one you want pressed, and a quieter one. */
  actions?: ReactNode;
  /** Two or three cards for the side where a sentence starts: the left in a language read from left to right. A task, a comment, an activity toast or a status card each. */
  start: readonly Snippet[];
  /** Two or three cards for the other side. */
  end: readonly Snippet[];
  /** What a screen reader hears in place of the cards. One sentence per card, written from their own words, when left out. */
  summary?: string;
}

/* Written out so Tailwind sees every class. A card is moved sideways a little and each one by a different amount. Under 1280px they stay inside the page's own margin; wider, they move further, past the edge of the content. */
const START_SHIFT = ["lg:-translate-x-2 xl:-translate-x-10", "lg:translate-x-3 xl:-translate-x-1", "lg:-translate-x-1 xl:-translate-x-7"] as const;
const END_SHIFT = ["lg:translate-x-1 xl:translate-x-4", "lg:translate-x-2 xl:translate-x-10", "lg:-translate-x-2 xl:translate-x-6"] as const;
/* The two sides sit at different heights: the start side is lifted and the end side lowered, each as a whole, so no two cards on one side ever crowd each other. */
const START_SIDE = "lg:-translate-y-5";
const END_SIDE = "lg:translate-y-6";

/**
 * A product opening where small interface cards flank a centred headline, in
 * place of one big screenshot underneath. Each side holds two or three cards
 * described by data (a task with its assignee and due date, a comment with a
 * reply field, an activity toast, a status card) and drawn with the real
 * checkbox, badge and avatar, so they look like the product. The cards float
 * at different heights and are moved sideways by a few plain CSS translations,
 * with one soft shadow; on wide screens they bleed a little past the content.
 * To a screen reader they are one sentence, they are inert, and nothing in
 * them depends on a pointer. Below 1024px they gather in a quiet stack under
 * the actions, two columns on a tablet and, on a phone, the first two cards of
 * each side in one column. A calm alternative to a hero image for collaboration and
 * workflow tools: no glow, no glass and no gradient.
 */
export function UiSnippetsHero({ titleAs: Title = "h2", eyebrow, title, description, actions, start, end, summary, className, ...props }: UiSnippetsHeroProps) {
  return (
    <section
      data-slot="ui-snippets-hero"
      className={cn(
        "grid grid-cols-1 gap-y-12 py-16 text-center sm:py-20",
        "lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)_minmax(0,1fr)] lg:items-center lg:gap-x-8 lg:gap-y-0 lg:py-28 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)_minmax(0,1fr)] xl:gap-x-12",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center lg:col-start-2 lg:row-start-1 lg:max-w-none">
        {eyebrow ? <p className="mb-5 text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title>
        {description ? <p className="mt-5 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
      </div>

      <p className="sr-only">{summary ?? [...start, ...end].map(describeSnippet).join(" ")}</p>

      {/* Under 1024px the two sides are the two columns of a quiet stack; from 1024px the wrapper steps aside and each side becomes a column of the section's own grid. */}
      <div className="mx-auto grid w-full max-w-sm gap-3 sm:max-w-2xl sm:grid-cols-2 sm:gap-4 lg:contents">
        <div aria-hidden="true" inert className={cn("flex min-w-0 flex-col gap-3 sm:gap-4 lg:col-start-1 lg:row-start-1 lg:items-end lg:gap-5 lg:justify-self-end", START_SIDE)}>
          {start.map((snippet, index) => (
            <SnippetCard key={`${index}-${snippet.kind}`} snippet={snippet} className={cn("lg:max-w-60 xl:max-w-68", index > 1 && "max-sm:hidden", START_SHIFT[index % START_SHIFT.length])} />
          ))}
        </div>
        <div aria-hidden="true" inert className={cn("flex min-w-0 flex-col gap-3 sm:gap-4 lg:col-start-3 lg:row-start-1 lg:items-start lg:gap-5 lg:justify-self-start", END_SIDE)}>
          {end.map((snippet, index) => (
            <SnippetCard key={`${index}-${snippet.kind}`} snippet={snippet} className={cn("lg:max-w-60 xl:max-w-68", index > 1 && "max-sm:hidden", END_SHIFT[index % END_SHIFT.length])} />
          ))}
        </div>
      </div>
    </section>
  );
}
