import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { lightBulbAsset } from "./assets/lightBulb";
export const lightBulb = { name: "light-bulb", parts: [], assets: [{ url: lightBulbAsset }] } as const satisfies ModelRecipe;
