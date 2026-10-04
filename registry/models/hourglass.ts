import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { hourglassAsset } from "./assets/hourglass";
export const hourglass = { name: "hourglass", parts: [], assets: [{ url: hourglassAsset }] } as const satisfies ModelRecipe;
