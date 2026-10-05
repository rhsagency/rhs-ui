import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { appleAsset } from "./assets/apple";
export const apple = { name: "apple", parts: [], assets: [{ url: appleAsset }] } as const satisfies ModelRecipe;
