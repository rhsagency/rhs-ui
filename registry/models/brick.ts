import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { brickAsset } from "./assets/brick";
export const brick = { name: "brick", parts: [], assets: [{ url: brickAsset }] } as const satisfies ModelRecipe;
