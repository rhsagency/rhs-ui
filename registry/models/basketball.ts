import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { basketballAsset } from "./assets/basketball";
export const basketball = { name: "basketball", parts: [], assets: [{ url: basketballAsset }] } as const satisfies ModelRecipe;
