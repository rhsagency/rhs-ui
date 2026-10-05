import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { dumbbellAsset } from "./assets/dumbbell";
export const dumbbell = { name: "dumbbell", parts: [], assets: [{ url: dumbbellAsset }] } as const satisfies ModelRecipe;
