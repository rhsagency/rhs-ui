"use client";

import type { ComponentProps } from "react";

import { IconArrowRight, IconZap } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface RecipeTrigger {
  /** The app the trigger happens in, as plain text: "Pipedrive". There are no logos, so a recipe is as easy to write as it is to read. */
  app: string;
  /** What happens there: "Deal won". */
  event: string;
}

export interface RecipeAction {
  /** The app the action happens in: "Slack". */
  app: string;
  /** What is done there: "Post a message". */
  action: string;
}

export interface AutomationRecipe {
  /** A stable id for the recipe. It keys the row and is what `onUse` receives, so it must be unique. */
  id: string;
  /** The id of the group (the tab) the recipe is listed under. Needed for every recipe when `groups` is set. */
  group?: string;
  /** What starts it. */
  trigger: RecipeTrigger;
  /** What it does, one to three actions in the order they run. */
  actions: readonly RecipeAction[];
  /** What it does for you, in one line: "Tell the team in Slack when a big deal is won". It is the recipe's heading. */
  outcome: string;
}

export interface RecipeGroup {
  /** The id that recipes name in `group`. */
  id: string;
  /** The tab's text: "Sales", "Support", "Finance". */
  label: string;
}

export interface AutomationRecipesLabels {
  /** The text of the button on every row. A screen reader also hears the recipe's outcome. */
  use: string;
  /** Read out before the trigger: "When". */
  when: string;
  /** Read out before the first action: "then". */
  then: string;
  /** Read out before every action after the first: "and". */
  and: string;
  /** The name of the actions of a recipe for assistive technology: "Actions". */
  actions: string;
  /** Names the row of tabs for assistive technology: "Recipes by team". */
  groups: string;
  /** Said under a tab that has no recipes. */
  empty: string;
}

export interface AutomationRecipesProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The small line over the heading: "Automations". */
  eyebrow?: string;
  /** The heading: "Start from a recipe". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The recipes, in the order you want them shown. */
  recipes: readonly AutomationRecipe[];
  /** Called with the recipe's id, and the recipe, when "Use this recipe" is pressed. The block starts nothing by itself. */
  onUse: (recipeId: string, recipe: AutomationRecipe) => void;
  /** Puts the recipes under tabs by team. Every recipe then names its group; one that names none is not shown, and a warning says so while you develop. */
  groups?: readonly RecipeGroup[];
  /** The tab shown at first, by id. The first one when left out. */
  defaultGroup?: string;
  /** The tab shown, by id, when you control the block. */
  group?: string;
  /** Called with the id of the tab after it is chosen. */
  onGroupChange?: (group: string) => void;
  /** The level of the heading: 2 by default. The outcome of each recipe sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<AutomationRecipesLabels>;
}

const LABELS: AutomationRecipesLabels = {
  use: "Use this recipe",
  when: "When",
  then: "then",
  and: "and",
  actions: "Actions",
  groups: "Recipes by team",
  empty: "There are no recipes here yet.",
};

/** The trigger is a soft fill with a bolt, the actions are outlines: the two kinds read apart without colour and without the word on each. */
const CHIP = "inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border px-3 py-1.5";

/**
 * Ready-made automations, one line each: when this happens in one app, do that in another, and one button to use
 * it. Each row is a list item whose heading is what the recipe does for you ("Tell the team in Slack when a big deal
 * is won"), and under it a trigger chip, an arrow and one to three action chips, with the app and the step written as
 * text, never as a logo. The chips wrap on a narrow block and the arrow turns to point down. The button calls
 * `onUse` with the recipe; it starts nothing itself. With `groups` the recipes sit under tabs by team (Sales,
 * Support, Finance) that move with the arrow keys. It shows what automation does in one line each, which is what
 * people browse before they ever open a builder.
 */
export function AutomationRecipes({ eyebrow, title, description, recipes, onUse, groups, defaultGroup, group, onGroupChange, headingLevel = 2, labels: custom, className, ...props }: AutomationRecipesProps) {
  const labels = { ...LABELS, ...custom };
  const Outcome = `h${headingLevel + 1}` as "h3" | "h4";

  if (process.env.NODE_ENV !== "production" && groups) {
    const known = new Set(groups.map((entry) => entry.id));
    const lost = recipes.filter((recipe) => !recipe.group || !known.has(recipe.group));
    if (lost.length) console.warn(`AutomationRecipes: ${lost.length} recipe(s) name no known group and are not shown: ${lost.map((recipe) => recipe.id).join(", ")}.`);
  }

  const list = (items: readonly AutomationRecipe[]) =>
    items.length === 0 ? (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{labels.empty}</p>
    ) : (
      <ul role="list" className="overflow-hidden rounded-xl border border-border bg-card">
        {items.map((recipe) => (
          <li key={recipe.id} className="grid gap-5 border-t border-border p-5 first:border-t-0 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:items-center @2xl:gap-8 @2xl:px-6">
            <div className="min-w-0">
              <Outcome className="text-base leading-snug font-medium tracking-[-0.01em] text-pretty">{recipe.outcome}</Outcome>
              <div className="mt-3.5 grid gap-2 @xl:grid-cols-[auto_auto_minmax(0,1fr)] @xl:gap-x-3">
                <span className={cn(CHIP, "w-fit border-border bg-muted")}>
                  <IconZap aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="sr-only">{labels.when} </span>
                    <span className="block text-xs leading-4 text-muted-foreground">{recipe.trigger.app}</span>
                    <span className="block text-[0.8125rem] leading-5 font-medium">{recipe.trigger.event}</span>
                  </span>
                </span>
                <IconArrowRight aria-hidden="true" className="ml-4 size-4 shrink-0 rotate-90 text-muted-foreground @xl:mt-4 @xl:ml-0 @xl:rotate-0" />
                <ul role="list" aria-label={labels.actions} className="flex min-w-0 flex-wrap gap-2">
                  {recipe.actions.map((action, index) => (
                    <li key={`${index}-${action.app}-${action.action}`} className="min-w-0 max-w-full">
                      <span className={cn(CHIP, "border-border bg-background")}>
                        <span className="min-w-0">
                          <span className="sr-only">{index === 0 ? labels.then : labels.and} </span>
                          <span className="block text-xs leading-4 text-muted-foreground">{action.app}</span>
                          <span className="block text-[0.8125rem] leading-5 font-medium">{action.action}</span>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="w-full @2xl:w-auto" onClick={() => onUse(recipe.id, recipe)}>
              {labels.use}
              <span className="sr-only">: {recipe.outcome}</span>
              <IconArrowRight aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <section data-slot="automation-recipes" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {groups && groups.length > 0 ? (
        <Tabs defaultValue={defaultGroup ?? groups[0]?.id} value={group} onValueChange={onGroupChange} className="mt-10 gap-6 @3xl:mt-12">
          {/* p-1 and h-10: the list scrolls when the tabs do not fit, and a scroller clips, so the 3px focus ring of a tab needs room inside it. */}
          <TabsList variant="pill" aria-label={labels.groups} className="relative h-10 max-w-full overflow-x-auto p-1">
            {groups.map((entry) => (
              <TabsTrigger key={entry.id} value={entry.id}>
                {entry.label}
                {/* The count takes the tab's own colour: faded, it fell below 4.5:1 on the inactive tabs. */}
                <span aria-hidden="true" className="tabular-nums">
                  {recipes.filter((recipe) => recipe.group === entry.id).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {groups.map((entry) => (
            <TabsContent key={entry.id} value={entry.id}>
              {list(recipes.filter((recipe) => recipe.group === entry.id))}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="mt-10 @3xl:mt-12">{list(recipes)}</div>
      )}
    </section>
  );
}
