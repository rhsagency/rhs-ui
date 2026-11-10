import { useId, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconEdit, IconFile, IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** One question and its answer. */
export interface AnswerRow {
  /** Identifies the question. It is handed to `onChange`, and rows are keyed by it. */
  key: string;
  /** The question, as the form asked it: "Email address". It is also what the Change link says to a screen reader. */
  label: string;
  /** The answer. Text keeps its line breaks and long words wrap. Empty (nothing, an empty string) reads as not provided. */
  value?: ReactNode;
  /** The answer is files: they are listed by name, one to a line. An empty list reads as not provided. */
  files?: readonly string[];
  /** Where Change goes: the page of the form that asks this question. A link. Without it, the row calls `onChange`. */
  href?: string;
  /** Called with the row's key when Change is pressed, instead of the one on the review. */
  onChange?: (key: string) => void;
  /** What is wrong with this answer: "Enter an email address in the correct format". Shown under the answer, in words, and read with the Change link. */
  error?: string;
}

/** A section of the form and the answers it collected. */
export interface AnswerGroup {
  /** What the section is called: "About you". */
  title: string;
  rows: readonly AnswerRow[];
}

/** The words the review says, for translation. */
export interface AnswersReviewLabels {
  /** The link of an answered row. Default "Change". */
  change?: string;
  /** The link of a row with no answer. Default "Add". */
  add?: string;
}

export interface AnswersReviewProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The sections, in the order the form asked them. */
  groups: readonly AnswerGroup[];
  /** What a row with no answer says. Default "Not provided". */
  emptyText?: string;
  /** Called with the key of the row when its Change (or Add) is pressed, for rows that have no `href` or `onChange` of their own. Go back to that question, with focus on it. */
  onChange?: (key: string) => void;
  /** The level of the section titles: 2 on a page of their own, 3 or 4 inside other sections. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** The words the review says, for translation. */
  labels?: AnswersReviewLabels;
}

const DEFAULT_LABELS = { change: "Change", add: "Add" } satisfies Required<AnswersReviewLabels>;

function isEmpty(row: AnswerRow): boolean {
  if (row.files !== undefined) return row.files.length === 0;
  const { value } = row;
  return value === undefined || value === null || value === false || (typeof value === "string" && value.trim() === "");
}

/**
 * The last step of a long form: every answer laid out as a description list, grouped by section, with a Change link on
 * each row that goes back to that question. A row with no answer says "Not provided" in muted text and offers Add instead
 * of Change. Multi-line answers such as addresses keep their line breaks, long values wrap and files are listed by name.
 * Every link carries hidden context ("Change Email address"), so a screen reader's list of links means something. A row
 * that failed validation carries an error note under its answer, which the link is described by, so the page doubles as the
 * place where a blocked submit gets fixed. It has no hooks of its own, so a Server Component can render it with `href`s.
 */
export function AnswersReview({ groups, emptyText = "Not provided", onChange, headingLevel = 2, labels, className, ...props }: AnswersReviewProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <div data-slot="answers-review" className={cn("grid gap-6", className)} {...props}>
      {groups.map((group, groupIndex) => {
        const headingId = `${base}-group-${groupIndex}`;
        return (
          <section key={`${groupIndex}-${group.title}`} aria-labelledby={headingId} className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <Heading id={headingId} className="border-b border-border bg-muted/30 px-5 py-3 text-sm leading-snug font-semibold tracking-[-0.01em] sm:px-6">
              {group.title}
            </Heading>
            <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
              {group.rows.map((row) => {
                const empty = isEmpty(row);
                const errorId = `${base}-${groupIndex}-${row.key}-error`;
                const handler = row.onChange ?? onChange;
                const word = empty ? text.add : text.change;
                const Icon = empty ? IconPlus : IconEdit;
                const link = (
                  <>
                    <Icon aria-hidden="true" />
                    {word}
                    <span className="sr-only"> {row.label}</span>
                  </>
                );
                return (
                  <div
                    key={row.key}
                    data-invalid={row.error ? "" : undefined}
                    className={cn(
                      // Every row takes its columns from the list, so the questions, the answers and the links line up from one row to the next.
                      "col-span-full grid grid-cols-subgrid gap-x-4 gap-y-1 border-t border-border px-5 py-4 first:border-t-0 sm:gap-x-6 sm:px-6",
                      row.error && "bg-destructive/5",
                    )}
                  >
                    <dt className="col-start-1 row-start-1 self-center text-sm text-muted-foreground sm:self-start sm:pt-px">{row.label}</dt>
                    <dd className="col-span-2 row-start-2 m-0 min-w-0 text-sm leading-relaxed sm:col-span-1 sm:col-start-2 sm:row-start-1">
                      {empty ? (
                        <span className="text-muted-foreground">{emptyText}</span>
                      ) : row.files ? (
                        <ul role="list" className="m-0 grid list-none gap-1.5 p-0">
                          {row.files.map((name, index) => (
                            <li key={`${index}-${name}`} className="flex items-start gap-2">
                              <IconFile aria-hidden="true" className="mt-[3px] size-4 shrink-0 text-muted-foreground" />
                              <span className="min-w-0 [overflow-wrap:anywhere]">{name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="block whitespace-pre-line [overflow-wrap:anywhere]">{row.value}</span>
                      )}
                      {row.error ? (
                        // Red on its own faint red: the plain token is a hair under 4.5:1 in the light theme, so the text takes a share of the foreground.
                        <p id={errorId} className="mt-2 flex items-start gap-1.5 text-sm leading-snug font-medium text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
                          <IconAlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
                          <span className="min-w-0 [overflow-wrap:anywhere]">{row.error}</span>
                        </p>
                      ) : null}
                    </dd>
                    {row.href || handler ? (
                      <dd className="col-start-2 row-start-1 m-0 self-center justify-self-end sm:col-start-3 sm:self-start">
                        {row.href ? (
                          <Button asChild variant="ghost" size="sm" className="-my-1 -mr-3 text-foreground">
                            <a href={row.href} aria-describedby={row.error ? errorId : undefined}>
                              {link}
                            </a>
                          </Button>
                        ) : (
                          <Button type="button" variant="ghost" size="sm" aria-describedby={row.error ? errorId : undefined} onClick={() => handler?.(row.key)} className="-my-1 -mr-3 text-foreground">
                            {link}
                          </Button>
                        )}
                      </dd>
                    ) : null}
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
