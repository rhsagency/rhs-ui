"use client";

import { useState, type ReactNode } from "react";

import { IconArrowRight, IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface WelcomeChoice {
  id: string;
  icon: ReactNode;
  label: string;
  description: string;
}

export interface OnboardingWelcomeProps {
  /** "Welcome, Anouk". */
  title: string;
  /** The question that tailors the workspace: "What will you use Ledger for?" */
  question: string;
  choices: readonly WelcomeChoice[];
  /** Pick more than one. */
  multiple?: boolean;
  onContinue: (ids: string[]) => void;
  onSkip?: () => void;
  /** The title is the page heading on the welcome screen; use h2 inside a larger page. */
  titleAs?: "h1" | "h2";
  className?: string;
}

/**
 * The first screen after sign-up: a greeting and one question with big
 * choice tiles, so the empty workspace can start with the right templates.
 * Tiles are checkboxes or radios underneath, continue waits for a pick,
 * and skip is always there.
 */
export function OnboardingWelcome({ title, question, choices, multiple = false, onContinue, onSkip, titleAs: Heading = "h1", className }: OnboardingWelcomeProps) {
  const [picked, setPicked] = useState<string[]>([]);
  function toggle(id: string) {
    setPicked((list) => (multiple ? (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]) : [id]));
  }
  return (
    <section data-slot="onboarding-welcome" className={cn("mx-auto w-full max-w-2xl text-center", className)}>
      <Heading className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</Heading>
      <fieldset className="mt-8">
        <legend className="mx-auto text-base text-muted-foreground">{question}{multiple ? " Pick any that apply." : ""}</legend>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          {choices.map((choice) => {
            const checked = picked.includes(choice.id);
            return (
              <label key={choice.id} className="relative flex cursor-pointer items-start gap-4 rounded-2xl border border-border p-5 transition-colors hover:bg-muted/60 has-[:checked]:border-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40">
                <input type={multiple ? "checkbox" : "radio"} name="onboarding-choice" value={choice.id} checked={checked} onChange={() => toggle(choice.id)} className="sr-only" />
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted [&_svg]:size-5">{choice.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{choice.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{choice.description}</span>
                </span>
                <span aria-hidden="true" className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border [&_svg]:size-3", checked && "border-foreground bg-foreground text-background")}>{checked ? <IconCheck /> : null}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-8 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
        {onSkip ? <Button variant="ghost" onClick={onSkip}>Skip for now</Button> : null}
        <Button size="lg" disabled={!picked.length} onClick={() => onContinue(picked)}>Continue <IconArrowRight /></Button>
      </div>
    </section>
  );
}
