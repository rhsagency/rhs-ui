import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { toothAsset } from "./assets/tooth";
export const tooth = { name: "tooth", parts: [], assets: [{ url: toothAsset }] } as const satisfies ModelRecipe;
