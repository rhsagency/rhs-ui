import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { coffeeCupAsset } from "./assets/coffeeCup";
export const coffeeCup = { name: "coffee-cup", parts: [], assets: [{ url: coffeeCupAsset }] } as const satisfies ModelRecipe;
