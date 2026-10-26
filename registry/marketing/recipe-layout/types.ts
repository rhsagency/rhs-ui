export interface RecipeIngredient {
  /** How much, for the number of servings the recipe is written for. Leave it out for "salt, to taste": a line without a quantity never scales. */
  quantity?: number;
  /** "g", "kg", "ml", "l", "tsp", "tbsp", "cup", or a counted unit such as "clove". Leave it out when the name counts itself: 2 eggs. */
  unit?: string;
  /** The unit when the amount is more than one: "cups", "cloves". Units such as g and tbsp need none. */
  unitPlural?: string;
  /** What it is: "spaghetti", "egg". */
  name: string;
  /** The name when the amount is more than one and there is no unit: "eggs". */
  plural?: string;
  /** Never a fraction: an egg is 1 or 2, never ¾. The amount is rounded to a whole number of at least one. */
  whole?: boolean;
  /** A note after the name: "finely chopped", "plus extra to serve". */
  note?: string;
  /** A heading for a stretch of the list ("For the sauce"): ingredients that follow each other with the same group share it. */
  group?: string;
}

export interface RecipeStepImage {
  src: string;
  /** What the picture shows, for someone who cannot see it. */
  alt: string;
  /** A line under the picture. */
  caption?: string;
}

export interface RecipeStepTimer {
  /** How long the step takes, in minutes. It becomes a timer the cook can start. */
  minutes: number;
  /** The button's text. The minutes by default: "12 min". */
  label?: string;
}

export interface RecipeStep {
  /** What to do, in a sentence or two of plain text. It is also what search engines read as the instruction. */
  text: string;
  /** A picture of the step. */
  image?: RecipeStepImage;
  /** A timer for a step that has to be waited out. */
  timer?: RecipeStepTimer;
}

/** All in minutes. The total is worked out from prep and cook when it is left out. */
export interface RecipeTimes {
  prep?: number;
  cook?: number;
  total?: number;
}

/** Per serving. Grams, except calories (kcal) and sodium (mg), which is how search engines read them. */
export interface RecipeNutrition {
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fibre?: number;
  protein?: number;
  sodium?: number;
}

export interface RecipeLabels {
  /** The label of the prep time. */
  prep: string;
  /** The label of the cook time. */
  cook: string;
  /** The label of the total time. */
  total: string;
  /** The label of the number of servings in the facts strip. */
  serves: string;
  /** The title of the ingredients section. */
  ingredients: string;
  /** The title of the method section. */
  method: string;
  /** The accessible name of the stepper, and the word beside it. */
  servings: string;
  /** The button that goes back to the written servings. {count} stands for the number. */
  reset: string;
  /** Said once, out loud, after the servings change. {count} stands for the number. */
  announce: string;
  /** The label of the keep-awake switch. */
  keepAwake: string;
  /** A line under it on why you would. */
  keepAwakeHint: string;
  /** Read out before the text of each step: "Step 3". */
  step: string;
  /** The title of the tips. */
  tips: string;
  /** The title of the nutrition panel. */
  nutrition: string;
  /** Under the nutrition heading: what the numbers are for. */
  perServing: string;
  /** The label of the calories row. */
  calories: string;
  /** The label of the fat row. */
  fat: string;
  /** The label of the saturated fat row. */
  saturatedFat: string;
  /** The label of the carbohydrates row. */
  carbohydrates: string;
  /** The label of the sugars row. */
  sugars: string;
  /** The label of the fibre row. */
  fibre: string;
  /** The label of the protein row. */
  protein: string;
  /** The label of the sodium row. */
  sodium: string;
  /** In front of the name of a line whose amount rounds to nothing. */
  pinch: string;
  /** The unit of an hour in a time: "h". */
  hour: string;
  /** The unit of a minute in a time: "min". */
  minute: string;
  /** The accessible name of the button that starts a timer. */
  startTimer: string;
  /** The accessible name of the button that pauses a timer. */
  pauseTimer: string;
  /** The accessible name of the button that resumes a timer. */
  resumeTimer: string;
  /** The accessible name of the button that resets a timer. */
  resetTimer: string;
  /** What a timer says when it runs out. */
  timeUp: string;
  /** Read out when a timer starts. {minutes} stands for the length. */
  timerStarted: string;
  /** Read out when a timer runs out. {step} stands for the number of the step. */
  timerDone: string;
}
