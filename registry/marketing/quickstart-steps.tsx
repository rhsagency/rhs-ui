"use client";

import { useState, type ComponentProps } from "react";

import { CopyField } from "@rhs-ui/application/copy-field";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconArrowRight, IconCheck, IconCornerDownRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface QuickstartStep {
  /** What the step does, as a short instruction: "Install the SDK". */
  title: string;
  /** The command to run. It is shown as written when the block has no `variants`, and for any package manager whose list leaves this step out. */
  command: string;
  /**
   * What the terminal prints when it worked. Plain text that can be selected; put several lines in with line breaks.
   * Where the output depends on the package manager, give an object keyed like `variants` instead: the reader sees the
   * output of the manager they chose, and none for a manager it leaves out.
   */
  expected?: string | Readonly<Record<string, string>>;
  /** One sentence under the title for the thing that trips people up: "Needs Node 20 or newer." */
  note?: string;
}

export interface QuickstartNext {
  /** The link's text: "Handle webhooks". */
  label: string;
  /** Where it goes. */
  href: string;
}

export interface QuickstartStepsLabels {
  /** The accessible name of the package-manager switch. */
  manager: string;
  /** Read out before each step's title, with its number: "Step 2: Create a payment". */
  step: string;
  /** The accessible name of each copy button. {n} stands for the step's number and {title} for its title, so two quickstarts on a page do not share names. */
  copy: string;
  /** The small label over the expected output. */
  expected: string;
  /** Said, politely, when the package manager changes. {manager} stands for its name. */
  showing: string;
  /** The line at the end of the list, before the link to what comes next. */
  done: string;
}

export interface QuickstartStepsProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The small line over the heading: "Quickstart". */
  eyebrow?: string;
  /** The heading: "From zero to a first payment in five minutes". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Three or four steps, in the order they are run. */
  steps: readonly QuickstartStep[];
  /**
   * One list of commands per package manager, each in step order: `{ pnpm: [...], npm: [...] }`. They become a
   * switch in the heading, over the steps, in the order of the keys. A step a list leaves out (or sets to null) keeps its own
   * `command`, so only the commands that differ need writing. Leave it out for a quickstart with no choice.
   */
  variants?: Readonly<Record<string, readonly (string | null | undefined)[]>>;
  /** The package manager shown first when you do not control it. The first key of `variants` by default. */
  defaultManager?: string;
  /** The package manager shown when you control it. */
  manager?: string;
  /** Called with the package manager after the switch changes. The block stores nothing itself; keep it somewhere if you want it remembered. */
  onManagerChange?: (manager: string) => void;
  /** Where to go once the steps worked. It ends the list as a last node with a button. */
  next?: QuickstartNext;
  /** The level of the heading: 2 by default. The title of each step sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<QuickstartStepsLabels>;
}

const LABELS: QuickstartStepsLabels = {
  manager: "Package manager",
  step: "Step",
  copy: "Copy command for step {n}: {title}",
  expected: "You should see",
  showing: "Showing {manager} commands",
  done: "That is it. You are up and running.",
};

/**
 * A command stays on one line beside its button while it fits. When it does not, the button drops under it, and a
 * command still too long for the screen wraps instead of hiding its end behind a scrollbar. Its characters are never
 * joined into ligatures: what is shown is exactly what is copied.
 */
const CODE = "[&>div]:flex-wrap [&>div]:justify-end [&_code]:flex-auto [&_code]:whitespace-normal [&_code]:[overflow-wrap:anywhere] [&_code]:[font-variant-ligatures:none]";

/**
 * The first five minutes, made checkable: three or four numbered steps, each
 * with the command in a copy field and, under it, what the terminal should
 * print, so a developer can tell at every step whether it worked before they
 * commit to the product. An optional switch swaps all commands to the reader's
 * package manager (pnpm, npm, yarn, bun, or any list of your own) and says so
 * politely. The expected output is plain, selectable text, never an image, and
 * every copy button carries its step number in its name, so a screen reader
 * does not hear three identical "Copy" buttons. Nothing is tracked or stored:
 * the choice lives in the block until the page is left, and `onManagerChange`
 * hands it to you if you want it kept. A last node links on to what comes next.
 */
export function QuickstartSteps({
  eyebrow,
  title,
  description,
  steps,
  variants,
  defaultManager,
  manager,
  onManagerChange,
  next,
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: QuickstartStepsProps) {
  const labels = { ...LABELS, ...custom };
  const managers = variants ? Object.keys(variants) : [];
  const [own, setOwn] = useState(defaultManager && managers.includes(defaultManager) ? defaultManager : (managers[0] ?? ""));
  const requested = manager ?? own;
  const current = managers.includes(requested) ? requested : (managers[0] ?? "");
  const StepTitle = `h${headingLevel + 1}` as "h3" | "h4";

  const choose = (value: string) => {
    if (manager === undefined) setOwn(value);
    onManagerChange?.(value);
  };
  // A null, undefined or empty entry means "same as the step's own command".
  const commandOf = (step: QuickstartStep, index: number) => (current ? variants?.[current]?.[index] : undefined) || step.command;
  // Output that differs by package manager is never guessed: a manager the step leaves out shows none.
  const expectedOf = (step: QuickstartStep): string | undefined => (typeof step.expected === "string" ? step.expected : step.expected?.[current]);

  return (
    <section data-slot="quickstart-steps" className={cn("@container w-full break-words", className)} {...props}>
      {/* The heading is as wide as the steps under it, so the package switch sits over the column it controls and not out past its right edge. */}
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        as={headingLevel === 3 ? "h3" : "h2"}
        className="max-w-3xl"
        action={managers.length > 1 ? <SegmentedControl label={labels.manager} options={managers.map((name) => ({ value: name, label: name }))} value={current} onValueChange={choose} /> : undefined}
      />
      {managers.length > 1 ? (
        <p role="status" aria-live="polite" className="sr-only">
          {labels.showing.replace("{manager}", current)}
        </p>
      ) : null}

      <ol role="list" className="mt-10 max-w-3xl @3xl:mt-12">
        {steps.map((step, index) => {
          const number = index + 1;
          return (
            <li key={`${index}-${step.title}`} className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 pb-9 @xl:gap-x-5 @xl:pb-11">
              <span aria-hidden="true" className="relative z-10 grid size-8 place-items-center rounded-full border border-foreground bg-background text-sm font-semibold tabular-nums">
                {number}
              </span>
              {/* The rail runs from under this number to just above the next node, and the last step's rail runs to the closing node. */}
              {index < steps.length - 1 || next ? <span aria-hidden="true" className="absolute top-10 bottom-1.5 left-4 w-px -translate-x-1/2 bg-border" /> : null}
              <div className="min-w-0 pt-[0.1875rem]">
                <StepTitle className="text-[1.0625rem] leading-snug font-medium tracking-[-0.02em] text-balance">
                  <span className="sr-only">
                    {labels.step} {number}:{" "}
                  </span>
                  {step.title}
                </StepTitle>
                {step.note ? <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{step.note}</p> : null}
                {/* The key follows the package manager, so a "Copied" from the old command never labels the new one. */}
                <CopyField key={`${current}-${index}`} value={commandOf(step, index)} label={labels.copy.replace("{n}", String(number)).replace("{title}", step.title)} className={cn("mt-3.5", CODE)} />
                {expectedOf(step) ? (
                  <div className="flex items-start gap-2.5 text-muted-foreground">
                    <IconCornerDownRight aria-hidden="true" className="mt-[0.1875rem] size-3.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{labels.expected}</p>
                      <pre className="mt-1 font-mono text-[0.8125rem] leading-relaxed break-words whitespace-pre-wrap select-text">{expectedOf(step)}</pre>
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {next ? (
        <div className="grid max-w-3xl grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 @xl:gap-x-5">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <IconCheck size={16} strokeWidth={2.25} />
          </span>
          <div className="flex min-w-0 flex-col gap-3 @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-6">
            <p className="text-[0.9375rem] font-medium tracking-[-0.01em]">{labels.done}</p>
            <Button asChild variant="outline" className="w-full @xl:w-auto">
              <a href={next.href}>
                {next.label}
                <IconArrowRight aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
