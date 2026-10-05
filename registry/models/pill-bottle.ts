import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { pillBottleAsset } from "./assets/pillBottle";
export const pillBottle = { name: "pill-bottle", parts: [], assets: [{ url: pillBottleAsset }] } as const satisfies ModelRecipe;
