"use client";

import { useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconChefHat, IconClock, IconFlame, IconIdea, IconUsers } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { cn } from "@/lib/utils";
import { KeepAwake } from "@rhs-ui/marketing/recipe-layout/keep-awake";
import { formatMinutes, showIngredient } from "@rhs-ui/marketing/recipe-layout/scale";
import { recipeJsonLdScript, type RecipeSchemaExtra } from "@rhs-ui/marketing/recipe-layout/schema";
import { StepTimer } from "@rhs-ui/marketing/recipe-layout/step-timer";
import type { RecipeIngredient, RecipeLabels, RecipeNutrition, RecipeStep, RecipeTimes } from "@rhs-ui/marketing/recipe-layout/types";

export type { RecipeIngredient, RecipeLabels, RecipeNutrition, RecipeStep, RecipeStepImage, RecipeStepTimer, RecipeTimes } from "@rhs-ui/marketing/recipe-layout/types";
export type { RecipeSchemaExtra } from "@rhs-ui/marketing/recipe-layout/schema";

export interface RecipeLayoutProps extends Omit<ComponentProps<"article">, "title"> {
  /** The recipe's name: "Slow-roasted tomato spaghetti". */
  title: string;
  /** A sentence or two on the dish. It is also the description in the Recipe data for search engines, so it is plain text. */
  intro?: string;
  /** A small line above the title: "Weeknight dinners". */
  eyebrow?: string;
  /** The main picture, under the intro. */
  image?: { src: string; alt: string };
  /** Prep, cook and total time in minutes. The total is worked out when it is left out. */
  times?: RecipeTimes;
  /** The number of servings the quantities are written for. */
  servings: number;
  /** The number of servings the page starts on, when it is not the one the recipe is written for. */
  defaultServings?: number;
  /** Called with the new number when the reader changes the servings. */
  onServingsChange?: (servings: number) => void;
  /** The ingredients for `servings`, in the order they are used. They are rescaled when the servings change. */
  ingredients: readonly RecipeIngredient[];
  /** The method, in order. Each step may have a picture and a timer. */
  steps: readonly RecipeStep[];
  /** Per serving. It does not change with the servings. */
  nutrition?: RecipeNutrition;
  /** Hints from the cook: how to keep it, what to swap. */
  tips?: readonly ReactNode[];
  /**
   * Writes the Recipe data for search engines into the page, made from these same props. Pass true, or an object
   * with the extra things search engines ask for: the picture's address, the author, the cuisine. Left out, nothing
   * is written; recipeJsonLd() in recipe-layout/schema gives you the same data to place yourself.
   */
  structuredData?: boolean | RecipeSchemaExtra;
  /** Offers a switch that keeps the screen on while cooking, where the browser can do it. On by default. */
  keepAwake?: boolean;
  /** The level of the title: 1 by default, because this is the page. Sections go one level below it. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<RecipeLabels>;
  /** Locale for numbers. */
  locale?: string;
}

const LABELS: RecipeLabels = {
  prep: "Prep",
  cook: "Cook",
  total: "Total",
  serves: "Serves",
  ingredients: "Ingredients",
  method: "Method",
  servings: "Servings",
  reset: "Back to {count}",
  announce: "Quantities updated for {count} servings.",
  keepAwake: "Keep screen awake",
  keepAwakeHint: "Stops the screen from dimming while you cook.",
  step: "Step",
  tips: "Tips",
  nutrition: "Nutrition",
  perServing: "Per serving",
  calories: "Calories",
  fat: "Fat",
  saturatedFat: "Saturated fat",
  carbohydrates: "Carbohydrates",
  sugars: "Sugars",
  fibre: "Fibre",
  protein: "Protein",
  sodium: "Sodium",
  pinch: "a pinch of",
  hour: "h",
  minute: "min",
  startTimer: "Start timer",
  pauseTimer: "Pause timer",
  resumeTimer: "Resume timer",
  resetTimer: "Reset timer",
  timeUp: "Time is up",
  timerStarted: "Timer started for {minutes} minutes.",
  timerDone: "Timer finished for step {step}.",
};

/** Consecutive ingredients that share a group are listed together under its heading. */
function groupsOf(ingredients: readonly RecipeIngredient[]): { title?: string; items: readonly RecipeIngredient[] }[] {
  const groups: { title?: string; items: RecipeIngredient[] }[] = [];
  for (const ingredient of ingredients) {
    const last = groups[groups.length - 1];
    if (last && last.title === ingredient.group) last.items.push(ingredient);
    else groups.push({ title: ingredient.group, items: [ingredient] });
  }
  return groups;
}

/**
 * A recipe page that cooks well: the times and the servings up front, the
 * ingredients beside the method on a wide screen (they stay in view while the
 * steps scroll past) and one after the other on a phone. A servings stepper
 * rescales every quantity, written the way a cook writes it (1½ tbsp, 750 g,
 * 1.2 kg) and announces the new count. Steps are an ordered list with large
 * numerals; a step may have a picture and a timer that counts down in place,
 * and where the browser can do it a switch keeps the screen on. The Recipe
 * data for search engines is made from the very same props, so the page and
 * its markup cannot disagree.
 */
export function RecipeLayout({
  title,
  intro,
  eyebrow,
  image,
  times,
  servings,
  defaultServings,
  onServingsChange,
  ingredients,
  steps,
  nutrition,
  tips = [],
  structuredData = false,
  keepAwake = true,
  headingLevel = 1,
  labels: custom,
  locale = "en-US",
  className,
  ...props
}: RecipeLayoutProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [count, setCount] = useState(Math.max(1, defaultServings ?? servings));
  const [announcement, setAnnouncement] = useState("");
  // Once the reader has changed the servings, an amount that changes lights up for a moment and settles.
  const [rescaled, setRescaled] = useState(false);
  const servingsField = useRef<HTMLInputElement>(null);
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Section = `h${headingLevel + 1}` as "h2" | "h3" | "h4";
  const Group = `h${headingLevel + 2}` as "h3" | "h4" | "h5";
  const number = new Intl.NumberFormat(locale);
  const factor = count / Math.max(1, servings);
  const words = { hour: labels.hour, minute: labels.minute };

  const total = times?.total ?? (times?.prep !== undefined || times?.cook !== undefined ? (times?.prep ?? 0) + (times?.cook ?? 0) : undefined);
  const facts: { label: string; value: string; icon: ReactNode }[] = [
    ...(times?.prep !== undefined ? [{ label: labels.prep, value: formatMinutes(times.prep, words, locale), icon: <IconChefHat /> }] : []),
    ...(times?.cook !== undefined ? [{ label: labels.cook, value: formatMinutes(times.cook, words, locale), icon: <IconFlame /> }] : []),
    ...(total !== undefined ? [{ label: labels.total, value: formatMinutes(total, words, locale), icon: <IconClock /> }] : []),
    { label: labels.serves, value: number.format(count), icon: <IconUsers /> },
  ];

  function change(next: number) {
    // The field reports its number whenever it is left, also when nothing was typed.
    if (next === count) return;
    setRescaled(true);
    setCount(next);
    onServingsChange?.(next);
    setAnnouncement(labels.announce.replace("{count}", number.format(next)));
  }

  function reset() {
    change(servings);
    // The button goes away as soon as the count is back, so focus moves to the field it belonged to, once the new number is in it.
    window.requestAnimationFrame(() => servingsField.current?.focus());
  }

  // The ingredients as they are written for this number of servings, grouped under their headings.
  const lines = groupsOf(ingredients).map((group) => ({
    title: group.title,
    items: group.items.map((ingredient) => {
      const shown = showIngredient(ingredient, factor, locale, labels.pinch);
      return { shown, written: [shown.amount, shown.unit].filter(Boolean).join(" ") };
    }),
  }));
  // The amount column fits the longest amount ("2½ handfuls") and is never narrower than 6.5rem, so no amount breaks over two lines and both groups line up.
  const longest = Math.max(0, ...lines.flatMap((group) => group.items.map((line) => line.written.length)));
  const amountColumn = { "--amount-width": `max(6.5rem, ${longest + 1}ch)` } as CSSProperties;

  const nutritionItems: DescriptionItem[] = [];
  const addNutrition = (term: string, value: number | undefined, unit: string) => {
    if (value !== undefined) nutritionItems.push({ term, value: `${number.format(value)} ${unit}` });
  };
  addNutrition(labels.calories, nutrition?.calories, "kcal");
  addNutrition(labels.fat, nutrition?.fat, "g");
  addNutrition(labels.saturatedFat, nutrition?.saturatedFat, "g");
  addNutrition(labels.carbohydrates, nutrition?.carbohydrates, "g");
  addNutrition(labels.sugars, nutrition?.sugars, "g");
  addNutrition(labels.fibre, nutrition?.fibre, "g");
  addNutrition(labels.protein, nutrition?.protein, "g");
  addNutrition(labels.sodium, nutrition?.sodium, "mg");

  const timerWords = { start: labels.startTimer, pause: labels.pauseTimer, resume: labels.resumeTimer, reset: labels.resetTimer, timeUp: labels.timeUp, started: labels.timerStarted, done: labels.timerDone };
  let lineNumber = 0;

  return (
    <article data-slot="recipe-layout" className={cn("w-full break-words", className)} {...props}>
      <header className="max-w-3xl">
        {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Title className="text-4xl leading-[1.06] font-medium tracking-[-0.045em] text-balance sm:text-5xl">{title}</Title>
        {intro ? <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">{intro}</p> : null}
      </header>

      {image ? (
        <figure className="mt-8">
          {/* Taller on a phone, where a wide banner would shrink the dish to nothing. */}
          <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-muted sm:aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral */}
            <img src={image.src} alt={image.alt} decoding="async" className="size-full object-cover" />
          </div>
        </figure>
      ) : null}

      {/* Two by two until 768px: four facts in a row need the room, or "1 h 10 min" breaks over two lines. */}
      <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card md:grid-flow-col md:auto-cols-fr">
        {facts.map((fact, index) => (
          <div key={fact.label} className={cn("relative min-w-0 border-border py-3.5 pr-3.5 pl-[3.625rem] sm:py-4 sm:pr-5 sm:pl-[4.375rem]", index % 2 === 1 && "border-l md:border-l-0", index >= 2 && "border-t md:border-t-0", index > 0 && "md:border-l")}>
            <dt className="text-xs text-muted-foreground">
              <span aria-hidden="true" className="absolute top-1/2 left-3.5 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-muted text-foreground sm:left-5 sm:size-9 [&_svg]:size-4 sm:[&_svg]:size-[1.125rem]">
                {fact.icon}
              </span>
              {fact.label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium whitespace-nowrap tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        <section aria-labelledby={`${id}-ingredients`} className="relative lg:sticky lg:top-8 lg:max-h-[calc(100svh-4rem)] lg:self-start lg:overflow-y-auto">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <Section id={`${id}-ingredients`} className="text-xl leading-tight font-semibold tracking-[-0.03em]">
              {labels.ingredients}
            </Section>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-muted/60 p-3">
              <span id={`${id}-servings`} className="text-sm font-medium">
                {labels.servings}
              </span>
              <NumberInput ref={servingsField} value={count} min={1} max={99} onValueChange={change} aria-labelledby={`${id}-servings`} className="w-32 bg-background" />
              {count !== servings ? (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-sm text-[0.8125rem] text-muted-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:text-foreground hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  {labels.reset.replace("{count}", number.format(servings))}
                </button>
              ) : null}
            </div>
            <p role="status" className="sr-only">
              {announcement}
            </p>
            <div style={amountColumn} className="mt-3 grid gap-5">
              {lines.map((group, groupIndex) => (
                <div key={`${group.title ?? "list"}-${groupIndex}`}>
                  {group.title ? <Group className="mb-1 pt-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{group.title}</Group> : null}
                  <ul role="list" className="divide-y divide-border">
                    {group.items.map(({ shown, written }) => {
                      lineNumber += 1;
                      return (
                        <li key={lineNumber} className="grid grid-cols-[var(--amount-width)_minmax(0,1fr)] gap-x-3 py-2.5 text-[0.9375rem] leading-snug">
                          {/* The key follows the text, so only an amount that changed starts again and lights up. */}
                          <span key={written} className={cn("self-start font-medium whitespace-nowrap tabular-nums", rescaled && "-mx-1 w-fit rounded-sm bg-transparent px-1 transition-colors duration-700 motion-reduce:transition-none starting:bg-foreground/15")}>
                            {written}
                          </span>
                          <span className="min-w-0">
                            {shown.name}
                            {shown.note ? <span className="text-muted-foreground">, {shown.note}</span> : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid min-w-0 content-start gap-12">
          <section aria-labelledby={`${id}-method`}>
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <Section id={`${id}-method`} className="text-xl leading-tight font-semibold tracking-[-0.03em]">
                {labels.method}
              </Section>
              {keepAwake ? <KeepAwake label={labels.keepAwake} hint={labels.keepAwakeHint} /> : null}
            </div>
            <ol role="list" className="mt-4 divide-y divide-border border-y border-border">
              {steps.map((step, index) => {
                const position = index + 1;
                return (
                  <li key={position} id={`${id}-step-${position}`} className="grid scroll-mt-24 gap-x-6 gap-y-2 py-7 sm:grid-cols-[3.75rem_minmax(0,1fr)]">
                    <span aria-hidden="true" className="text-4xl leading-none font-medium tracking-[-0.06em] text-muted-foreground/70 tabular-nums sm:text-5xl">
                      {position}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base leading-relaxed sm:text-[1.0625rem]">
                        <span className="sr-only">
                          {labels.step} {position}:{" "}
                        </span>
                        {step.text}
                      </p>
                      {step.image ? (
                        <figure className="mt-5">
                          <AspectRatio ratio={16 / 10} className="overflow-hidden rounded-xl border border-border bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral */}
                            <img src={step.image.src} alt={step.image.alt} loading="lazy" decoding="async" className="size-full object-cover" />
                          </AspectRatio>
                          {step.image.caption ? <figcaption className="mt-2.5 text-sm text-muted-foreground">{step.image.caption}</figcaption> : null}
                        </figure>
                      ) : null}
                      {step.timer ? <StepTimer className="mt-4" minutes={step.timer.minutes} label={step.timer.label} step={position} labels={timerWords} /> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {tips.length || nutritionItems.length ? (
            <div className="grid items-start gap-5 md:grid-cols-2">
              {tips.length ? (
                <section aria-labelledby={`${id}-tips`} className="rounded-2xl border border-border bg-muted/40 p-5 sm:p-6">
                  <Section id={`${id}-tips`} className="flex items-center gap-2.5 text-base leading-tight font-semibold tracking-[-0.02em]">
                    <IconIdea aria-hidden="true" className="size-[1.125rem]" />
                    {labels.tips}
                  </Section>
                  <ul role="list" className="mt-4 grid gap-3">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                        <span aria-hidden="true" className="mt-[0.5625rem] size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                        <span className="min-w-0">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {nutritionItems.length ? (
                <section aria-labelledby={`${id}-nutrition`} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <Section id={`${id}-nutrition`} className="text-base leading-tight font-semibold tracking-[-0.02em]">
                    {labels.nutrition}
                  </Section>
                  <p className="mt-1 text-xs text-muted-foreground">{labels.perServing}</p>
                  <DescriptionList items={nutritionItems} className="mt-4 [&_dd]:tabular-nums" />
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {structuredData ? (
        <script
          type="application/ld+json"
          // The text is JSON with its < escaped, so nothing in the recipe can close the script.
          dangerouslySetInnerHTML={{
            __html: recipeJsonLdScript(
              { title, intro, times, servings, ingredients, steps, nutrition },
              { image: image?.src, ...(typeof structuredData === "object" ? structuredData : {}) },
              locale,
            ),
          }}
        />
      ) : null}
    </article>
  );
}
