import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { houseKeyAsset } from "./assets/houseKey";
export const houseKey = { name: "house-key", parts: [], assets: [{ url: houseKeyAsset }] } as const satisfies ModelRecipe;
