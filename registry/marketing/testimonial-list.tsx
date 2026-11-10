import type { ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface TestimonialListItem {
  /** Identifies the quote in the list. */
  id: string;
  /** What they said, without the quotation marks: the list adds them. */
  quote: string;
  /** Who said it. Also the source of the initials when there is no portrait. */
  name: string;
  /** Their job: "Head of operations". */
  role: string;
  /** Where they work, written after the role: "Northwind Logistics". */
  company: string;
  /** A portrait. Initials stand in until it loads, and when there is none. */
  avatar?: string;
  /** The outcome in a few words: "Churn down 18 percent". It is set as a chip beside the person. */
  result?: string;
}

export interface TestimonialListLabels {
  /** Said before a result chip to a screen reader, so the chip is not a loose phrase. Default "Result". */
  result: string;
}

export interface TestimonialListProps extends Omit<ComponentProps<"section">, "title"> {
  /** A line in small capitals above the title: "Customers". */
  eyebrow?: string;
  /** The heading of the section. */
  title: string;
  /** The quotes, in the order they are read. Three to six read well; each row is as tall as its quote. */
  testimonials: readonly TestimonialListItem[];
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<TestimonialListLabels>;
}

const LABELS: TestimonialListLabels = { result: "Result" };

/**
 * Customer quotes as editorial rows, for pages where the words carry the
 * proof: agencies, advisers and B2B services. Each row is a figure on two
 * columns, the quote large and tightly set on the left, and on the right a
 * portrait or initials, the name, the role and company, and an optional chip
 * with the result. Hairlines divide the rows and there are no boxes, so six
 * long quotes still read as one page and not six objects. On a phone a row is
 * the quote, then the person. Nothing moves, so it reads the same in print. No
 * state of its own, so it renders on the server.
 */
export function TestimonialList({ eyebrow, title, testimonials, labels, className, ...props }: TestimonialListProps) {
  const words = { ...LABELS, ...labels };

  return (
    <section data-slot="testimonial-list" className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="max-w-2xl">
        {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">{title}</h2>
      </header>
      <ul className="mt-12 border-b border-border sm:mt-16">
        {testimonials.map((item) => (
          <li key={item.id} className="border-t border-border">
            <figure className="grid gap-8 py-10 md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] md:gap-16 md:py-14">
              <blockquote>
                <p className="text-[1.5rem] leading-[1.22] font-medium tracking-[-0.03em] text-pretty sm:text-[1.875rem] lg:text-[2.125rem]">&ldquo;{item.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="flex flex-col items-start gap-5 md:pt-1.5">
                <div className="flex items-center gap-3.5">
                  <Avatar size="lg">
                    {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
                    <AvatarFallback>{initialsOf(item.name)}</AvatarFallback>
                  </Avatar>
                  <div className="grid text-sm">
                    <cite className="font-medium not-italic">{item.name}</cite>
                    <span className="text-muted-foreground">
                      {item.role}, {item.company}
                    </span>
                  </div>
                </div>
                {item.result ? (
                  <Badge variant="outline" className="h-auto min-h-6 px-3 py-0.5 text-[0.8125rem] whitespace-normal">
                    <span className="sr-only">{words.result}: </span>
                    {item.result}
                  </Badge>
                ) : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
