import { ingredientLine } from "@rhs-ui/marketing/recipe-layout/scale";
import type { RecipeIngredient, RecipeNutrition, RecipeStep, RecipeTimes } from "@rhs-ui/marketing/recipe-layout/types";

/** What the Recipe data is made from: the same props the layout takes. */
export interface RecipeSchemaInput {
  title: string;
  intro?: string;
  times?: RecipeTimes;
  /** The servings the recipe is written for. */
  servings: number;
  ingredients: readonly RecipeIngredient[];
  steps: readonly RecipeStep[];
  nutrition?: RecipeNutrition;
}

/** What search engines ask for that the page itself does not show. */
export interface RecipeSchemaExtra {
  /** Address of the main picture, or several. Google needs one to show a recipe in its results. */
  image?: string | readonly string[];
  /** Who wrote it. */
  author?: string;
  /** When it was published, as an ISO date. */
  datePublished?: string;
  /** "Italian". */
  cuisine?: string;
  /** "Main course". */
  category?: string;
  /** Words people search for, separated by commas. */
  keywords?: string;
}

/** Minutes as an ISO 8601 duration: 75 is "PT1H15M". */
export function isoDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `PT${hours ? `${hours}H` : ""}${rest || !hours ? `${rest}M` : ""}`;
}

/**
 * The Recipe data for search engines (schema.org), made from the props of the
 * layout, so the page and its structured data cannot disagree. Ingredients are
 * written for the servings the recipe is written for, not for the number a
 * reader picked.
 */
export function recipeJsonLd(recipe: RecipeSchemaInput, extra: RecipeSchemaExtra = {}, locale = "en-US"): Record<string, unknown> {
  const { times, nutrition } = recipe;
  const total = times?.total ?? (times?.prep !== undefined || times?.cook !== undefined ? (times?.prep ?? 0) + (times?.cook ?? 0) : undefined);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    ...(recipe.intro ? { description: recipe.intro } : {}),
    ...(extra.image ? { image: extra.image } : {}),
    ...(extra.author ? { author: { "@type": "Person", name: extra.author } } : {}),
    ...(extra.datePublished ? { datePublished: extra.datePublished } : {}),
    ...(extra.cuisine ? { recipeCuisine: extra.cuisine } : {}),
    ...(extra.category ? { recipeCategory: extra.category } : {}),
    ...(extra.keywords ? { keywords: extra.keywords } : {}),
    ...(times?.prep !== undefined ? { prepTime: isoDuration(times.prep) } : {}),
    ...(times?.cook !== undefined ? { cookTime: isoDuration(times.cook) } : {}),
    ...(total !== undefined ? { totalTime: isoDuration(total) } : {}),
    recipeYield: `${recipe.servings} servings`,
    recipeIngredient: recipe.ingredients.map((ingredient) => ingredientLine(ingredient, 1, locale)),
    recipeInstructions: recipe.steps.map((step) => ({ "@type": "HowToStep", text: step.text, ...(step.image ? { image: step.image.src } : {}) })),
  };
  if (nutrition) {
    const grams = (value: number | undefined) => (value === undefined ? undefined : `${value} g`);
    data.nutrition = Object.fromEntries(
      Object.entries({
        "@type": "NutritionInformation",
        servingSize: "1 serving",
        calories: nutrition.calories === undefined ? undefined : `${nutrition.calories} calories`,
        fatContent: grams(nutrition.fat),
        saturatedFatContent: grams(nutrition.saturatedFat),
        carbohydrateContent: grams(nutrition.carbohydrates),
        sugarContent: grams(nutrition.sugars),
        fiberContent: grams(nutrition.fibre),
        proteinContent: grams(nutrition.protein),
        sodiumContent: nutrition.sodium === undefined ? undefined : `${nutrition.sodium} mg`,
      }).filter(([, value]) => value !== undefined),
    );
  }
  return data;
}

/** The Recipe data as the text of a script element. The < is escaped, so nothing in a title can close the script. */
export function recipeJsonLdScript(recipe: RecipeSchemaInput, extra: RecipeSchemaExtra = {}, locale = "en-US"): string {
  return JSON.stringify(recipeJsonLd(recipe, extra, locale)).replace(/</g, "\\u003c");
}
