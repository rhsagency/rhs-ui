import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { coffeeMugAsset } from "./assets/coffeeMug";
export const coffeeMug = { name: "coffee-mug", parts: [], assets: [{ url: coffeeMugAsset }] } as const satisfies ModelRecipe;
