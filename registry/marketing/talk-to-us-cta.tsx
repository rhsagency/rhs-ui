import { useId, type ComponentProps, type ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface CtaPerson {
  /** Their name, as you would say it to a visitor: "Maya Okafor". */
  name: string;
  /** What they do: "Customer success". */
  role: string;
  /** A photo. The initials show until it loads, or when there is none. */
  avatar?: string;
}

export type CtaStatus = "online" | "away" | "offline";

export interface TalkToUsCtaProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** One to three people who will answer. More than three are not shown. */
  people: readonly CtaPerson[];
  /** The ask, in the first person if you can: "Not sure which plan fits? Talk to Maya." */
  title: string;
  /** One or two sentences on what they can help with. */
  description?: string;
  /**
   * When and how fast they answer, in words: "Online now, replies in about 10 minutes". Say the state in the
   * text too; the dot beside it repeats it and is hidden from assistive technology. It is a polite status
   * region, so a change is announced once and nothing is read when the page loads.
   */
  availability?: string;
  /** Whether they are there right now. The dot is solid when online, a ring when away and a thin ring when offline. Online by default. */
  status?: CtaStatus;
  /** The actions, usually two: a Button to book a call and a link to write an email. */
  actions: ReactNode;
  /** The level of the title: 2 by default. */
  headingLevel?: 2 | 3 | 4;
}

const DOT: Record<CtaStatus, string> = {
  online: "bg-foreground ring-4 ring-foreground/15",
  away: "border-2 border-foreground",
  offline: "border border-muted-foreground",
};

/**
 * A closing ask led by real people, for the moment when a person converts
 * better than a form: one to three faces, their names and roles, a heading in
 * the first person, two actions, and a line that says whether they are there
 * and how fast they answer. Place it after a FAQ, beside pricing, or above the
 * footer, to catch the visitor who has a question rather than an objection.
 * Availability is a dot and words together, never colour alone, and it is a
 * polite status region that stays quiet until it changes.
 */
export function TalkToUsCta({ people, title, description, availability, status = "online", actions, headingLevel = 2, className, ...props }: TalkToUsCtaProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const shown = people.slice(0, 3);
  return (
    <section data-slot="talk-to-us-cta" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container w-full rounded-2xl border border-border bg-card text-center break-words", className)} {...props}>
      {/* The padding sits on an inner box: a container cannot query its own width, only its children can, so on the section itself the roomier padding for a wide card would never apply. */}
      <div className="px-5 py-10 @2xl:px-12 @2xl:py-14">
        {/* The names are written below, so the faces are decoration. */}
        {shown.length ? (
          <div aria-hidden="true" className="flex justify-center -space-x-3">
            {shown.map((person) => (
              <Avatar key={person.name} size="lg" className="ring-[3px] ring-card data-[size=lg]:size-14">
                {person.avatar ? <AvatarImage src={person.avatar} alt="" /> : null}
                <AvatarFallback className="inset-ring-1 inset-ring-border">{initialsOf(person.name)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : null}
        {shown.length ? (
          // Three names share one row in three equal columns, so a narrow card never leaves one of them alone on a second line.
          <ul role="list" className={cn("mt-4", shown.length === 3 ? "mx-auto grid max-w-sm grid-cols-3 gap-x-3" : "flex flex-wrap justify-center gap-x-8 gap-y-3")}>
            {shown.map((person) => (
              <li key={person.name} className="min-w-0 text-center">
                <p className="text-sm leading-tight font-medium">{person.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{person.role}</p>
              </li>
            ))}
          </ul>
        ) : null}

        <Heading id={`${id}-title`} className={cn("mx-auto max-w-xl text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl", shown.length > 0 && "mt-7")}>
          {title}
        </Heading>
        {description ? <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 @sm:flex-row @sm:items-center">{actions}</div>

        {availability ? (
          <div className="mt-6 flex justify-center">
            <p role="status" className="inline-flex max-w-full items-start gap-2.5 rounded-xl border border-border bg-background px-3.5 py-2 text-left text-sm text-muted-foreground">
              <span aria-hidden="true" data-slot="talk-to-us-cta-dot" className={cn("mt-[0.3125rem] size-2.5 shrink-0 rounded-full", DOT[status])} />
              <span className="min-w-0 text-pretty">{availability}</span>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
