import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { pencilAsset } from "./assets/pencil";
export const pencil = { name: "pencil", parts: [], assets: [{ url: pencilAsset }] } as const satisfies ModelRecipe;
