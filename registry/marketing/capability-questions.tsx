import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight, IconCheck, IconClock, IconMinus, IconPlus } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

/** yes: it does. plan: it does, on a plan above the one the reader is looking at. soon: it does not yet, and is planned. no: it does not, and is not planned. */
export type CapabilityVerdict = "yes" | "plan" | "soon" | "no";

export interface CapabilityQuestion {
  /** The question as a visitor asks it: "Can I import from a spreadsheet?". It is a heading. */
  question: string;
  /** The honest short answer, shown as a pill with a word and a shape. */
  verdict: CapabilityVerdict;
  /** The plan it needs, when the verdict is plan: "Business". The pill reads "On Business". */
  plan?: string;
  /** One or two sentences. For soon and no, say what to do instead, so the gap is named and not hidden. */
  answer: ReactNode;
  /** The docs page on it. */
  href?: string;
  /** The id of the group it sits under, from `groups`. */
  group?: string;
}

export interface CapabilityGroup {
  /** The id that questions list in `group`. */
  id: string;
  /** The group's heading: "Data and import". */
  label: string;
}

export interface CapabilityContact {
  /** The line before the link: "Not here? We answer every question within a working day." */
  text: string;
  /** The link's text: "Ask the team". */
  label: string;
  /** Where it goes: a contact page or a mailto: link. */
  href: string;
}

export interface CapabilityQuestionsLabels {
  /** The pill of a yes. */
  yes: string;
  /** The pill of a plan verdict. {plan} stands for the plan's name. */
  plan: string;
  /** The pill of a plan verdict that names no plan. */
  paid: string;
  /** The pill of a soon verdict. */
  soon: string;
  /** The pill of a no. */
  no: string;
  /** The docs link under an answer. A screen reader also hears the question. */
  docs: string;
}

export interface CapabilityQuestionsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Before you ask". */
  eyebrow?: string;
  /** The heading: "Can it do what you need?". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The questions, in the order you want them. Every one shows its answer: nothing opens or closes. */
  items: readonly CapabilityQuestion[];
  /** Heads that sort the questions into topics. Questions without a group sit first, under no heading. */
  groups?: readonly CapabilityGroup[];
  /** A line after the list for the question that is not there. */
  contact?: CapabilityContact;
  /** The level of the heading: 2 by default. A group's heading is one level below it, and a question is one level below that, or directly below the heading when there are no groups. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CapabilityQuestionsLabels>;
}

const LABELS: CapabilityQuestionsLabels = { yes: "Yes", plan: "On {plan}", paid: "On a paid plan", soon: "Not yet", no: "No", docs: "Read the docs" };

/**
 * Each verdict has its own shape and its own fill, and always its word, so none of them depends on colour: a check
 * on a solid pill, a plus on an outline, a clock on a soft one, a dash on a dashed one.
 */
const VERDICTS: Record<CapabilityVerdict, { icon: typeof IconCheck; variant: NonNullable<BadgeProps["variant"]>; className?: string }> = {
  yes: { icon: IconCheck, variant: "default" },
  plan: { icon: IconPlus, variant: "outline" },
  soon: { icon: IconClock, variant: "secondary" },
  no: { icon: IconMinus, variant: "outline", className: "border-dashed text-muted-foreground" },
};

const LINK =
  "group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

function Arrow(): React.JSX.Element {
  return <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />;
}

/**
 * The questions sales hears most, answered with a verdict: yes, yes on a plan, not yet, or no, with the how
 * underneath. A two-column list on a wide block and one column on a narrow one. Every answer is on the page, so it
 * can be scanned, searched and indexed; it is deliberately not an accordion. Each verdict is a pill with a shape
 * and a word, so none relies on colour. A not-yet or no answer names what to do instead, and that honest gap is
 * what makes the yeses believable. The question is the heading, so a screen reader can jump between them; the
 * verdict is read after it, then the answer.
 */
export function CapabilityQuestions({ eyebrow, title, description, items, groups, contact, headingLevel = 2, labels: custom, className, ...props }: CapabilityQuestionsProps) {
  const labels = { ...LABELS, ...custom };
  const known = new Set((groups ?? []).map((group) => group.id));
  const loose = items.filter((item) => !item.group || !known.has(item.group));
  const sections = [
    ...(loose.length ? [{ id: "", label: undefined as string | undefined, items: loose }] : []),
    ...(groups ?? []).map((group) => ({ id: group.id, label: group.label as string | undefined, items: items.filter((item) => item.group === group.id) })).filter((section) => section.items.length),
  ];
  const grouped = sections.some((section) => section.label);
  const GroupTitle = `h${headingLevel + 1}` as "h3" | "h4";
  const Question = `h${headingLevel + (grouped ? 2 : 1)}` as "h3" | "h4" | "h5";

  return (
    <section data-slot="capability-questions" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      <div className="mt-10 grid gap-y-14 @3xl:mt-14">
        {sections.map((section) => (
          <div key={section.id}>
            {/* The topic is a rung above its questions (24px against 18px), so it reads as a heading over them and not as one more of them. */}
            {section.label ? <GroupTitle className="mb-6 text-2xl leading-snug font-medium tracking-[-0.03em] text-balance">{section.label}</GroupTitle> : null}
            <ul role="list" className="grid gap-x-16 @3xl:grid-cols-2">
              {section.items.map((item, index) => {
                const verdict = VERDICTS[item.verdict];
                const Icon = verdict.icon;
                const word = item.verdict === "plan" ? (item.plan ? labels.plan.replace("{plan}", item.plan) : labels.paid) : labels[item.verdict];
                return (
                  <li key={`${index}-${item.question}`} className="flex min-w-0 flex-col border-t border-border py-7">
                    {/* The question comes first for a screen reader, then the verdict and the answer; the pill is drawn above it. */}
                    <Question className="mt-4 text-lg leading-snug font-medium tracking-[-0.02em] text-balance">{item.question}</Question>
                    <Badge variant={verdict.variant} className={cn("order-first h-6 gap-1.5 px-2.5 text-[0.8125rem] [&>svg]:size-3.5", verdict.className)}>
                      <Icon aria-hidden="true" />
                      {word}
                    </Badge>
                    <div className="mt-2.5 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{item.answer}</div>
                    {item.href ? (
                      <div className="mt-4">
                        <a href={item.href} className={LINK}>
                          {labels.docs}
                          <span className="sr-only">: {item.question}</span>
                          <Arrow />
                        </a>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {contact ? (
        <p className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-7 text-[0.9375rem]">
          <span className="text-muted-foreground">{contact.text}</span>
          <a href={contact.href} className={LINK}>
            {contact.label}
            <Arrow />
          </a>
        </p>
      ) : null}
    </section>
  );
}
