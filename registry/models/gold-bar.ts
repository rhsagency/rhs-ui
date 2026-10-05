import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { goldBarAsset } from "./assets/goldBar";
export const goldBar = { name: "gold-bar", parts: [], assets: [{ url: goldBarAsset }] } as const satisfies ModelRecipe;
