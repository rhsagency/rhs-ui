"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconInfo, IconSparkle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface PromptExample {
  /** A stable key for the example, and the value of its tab: "summarise". */
  id: string;
  /** The tab, in a word: "Summarise", "Draft", "Analyse", "Translate". */
  label: string;
  /** A glyph from @rhs-ui/icons for the tab. It is decoration: the label names the task. */
  icon?: ReactNode;
  /** The prompt as a person would type it. Line breaks are kept. */
  prompt: string;
  /** The answer, written by you: a short list, a table, a few paragraphs. It is styled as prose, so plain p, ul, ol and strong elements are enough, and a Table sits in it as it is. */
  answer: ReactNode;
  /** A line under the answer, such as "Example output, edited for length". It is only shown when you pass one. */
  note?: string;
}

export interface PromptExamplesLabels {
  /** The name of the list of tabs for assistive technology. */
  tasks: string;
  /** The small word over the prompt. */
  prompt: string;
  /** The small word at the top of the answer card. */
  answer: string;
  /** The text of the action that hands the prompt to your product. */
  tryPrompt: string;
}

const LABELS: PromptExamplesLabels = { tasks: "Tasks", prompt: "Prompt", answer: "Answer", tryPrompt: "Try this prompt" };

export interface PromptExamplesProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The heading: "See what it does with a real task". */
  title: string;
  /** One or two sentences under the heading. Say plainly that the answers are written examples. */
  description?: string;
  /** Three to five examples, one tab each. Every answer is yours, so there is no model to call, no key to hold and no rate limit to meet. */
  examples: readonly PromptExample[];
  /** Called when a reader presses Try this prompt, with the prompt and its example. Without it the action is not shown. */
  onTry?: (prompt: string, example: PromptExample) => void;
  /** The `id` of the open example, to control the tabs. */
  value?: string;
  /** The `id` of the example that opens first when the tabs are not controlled. The first one by default. */
  defaultValue?: string;
  /** Called with the `id` of the example a reader opens. */
  onValueChange?: (value: string) => void;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PromptExamplesLabels>;
}

/**
 * Four tabs need about 326px at full size. Below 21.25rem (340px) of width the triggers give up some padding and a point
 * of type (about 262px), so on a small phone the last tab is not cut off at the edge of the list.
 */
const TRIGGER = "text-[13px] group-data-[variant=pill]/list:px-1.5 @min-[21.25rem]:text-sm @min-[21.25rem]:group-data-[variant=pill]/list:px-3";

/** An answer is plain elements; this dresses the ones an answer is made of, so they need no classes of their own. */
const ANSWER =
  "text-sm leading-relaxed text-pretty [&_li]:pl-1 [&_li]:marker:text-muted-foreground [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p+ol]:mt-3 [&_p+p]:mt-3 [&_p+[data-slot=table-container]]:mt-3 [&_p+ul]:mt-3 [&_strong]:font-semibold [&_[data-slot=table-container]+p]:mt-4 [&_ul+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5";

/**
 * What an AI feature can do, shown without running one: a tab per task
 * (Summarise, Draft, Analyse, Translate), and under each tab the prompt in a
 * bubble and the answer in a bordered card, with an action that hands the
 * prompt to your product. The answers are written by you, so the section is
 * honest about what it is, needs no key and has no rate limit, and a note such
 * as "Example output, edited for length" says so under any answer you give one.
 * The tabs are real tabs, with arrow keys and roving focus. The panels sit
 * on top of each other and only the open one is visible, so the section is as
 * tall as the tallest answer and nothing below it jumps when a tab changes;
 * the answers of the closed tabs stay in the page for search engines but are
 * hidden from the screen and from the keyboard. A panel is as tall as its own
 * answer, so its focus outline wraps what it holds and stands a few pixels clear
 * of it, and an answer that is wider than the section (a table) scrolls inside
 * its card instead of pushing the section wider.
 */
export function PromptExamples({ title, description, examples, onTry, value, defaultValue, onValueChange, headingLevel = 2, labels: custom, className, ...props }: PromptExamplesProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <section data-slot="prompt-examples" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="mx-auto max-w-2xl text-center">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
      </div>

      <Tabs value={value} defaultValue={value === undefined ? (defaultValue ?? examples[0]?.id) : undefined} onValueChange={onValueChange} className="mt-10 gap-8 @3xl:mt-12">
        <TabsList variant="pill" aria-label={labels.tasks} className="relative mx-auto max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {examples.map((example) => (
            <TabsTrigger key={example.id} value={example.id} className={TRIGGER}>
              {example.icon ? (
                <span aria-hidden="true" className="hidden @lg:contents">
                  {example.icon}
                </span>
              ) : null}
              {example.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Every panel is in the same cell of one grid and only the open one is visible, so the section is as tall as its tallest answer. */}
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)]">
          {examples.map((example) => (
            <TabsContent
              key={example.id}
              value={example.id}
              forceMount
              className="col-start-1 row-start-1 self-start rounded-xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-solid focus-visible:outline-ring/40 data-[state=inactive]:invisible"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-muted-foreground">{labels.prompt}</p>
                  <p className="max-w-[92%] rounded-2xl rounded-br-md bg-muted px-4 py-3 text-sm leading-relaxed whitespace-pre-line @lg:max-w-[85%]">{example.prompt}</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-xs @lg:p-6">
                  <p className="mb-4 flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    <IconSparkle aria-hidden="true" className="size-4" />
                    {labels.answer}
                  </p>
                  <div className={ANSWER}>{example.answer}</div>
                </div>

                {example.note || onTry ? (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    {example.note ? (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconInfo aria-hidden="true" className="size-4 shrink-0" />
                        {example.note}
                      </p>
                    ) : null}
                    {/* Always at the end of the line, so it stays on one side whether or not a tab has a note, and when it wraps under a long one. */}
                    {onTry ? (
                      <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => onTry(example.prompt, example)}>
                        {labels.tryPrompt}
                        <IconArrowRight aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </section>
  );
}
