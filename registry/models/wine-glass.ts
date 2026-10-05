import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { wineGlassAsset } from "./assets/wineGlass";
export const wineGlass = { name: "wine-glass", parts: [], assets: [{ url: wineGlassAsset }] } as const satisfies ModelRecipe;
