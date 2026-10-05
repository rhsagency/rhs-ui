import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { suitcaseAsset } from "./assets/suitcase";
export const suitcase = { name: "suitcase", parts: [], assets: [{ url: suitcaseAsset }] } as const satisfies ModelRecipe;
