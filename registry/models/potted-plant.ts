import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { pottedPlantAsset } from "./assets/pottedPlant";
export const pottedPlant = { name: "potted-plant", parts: [], assets: [{ url: pottedPlantAsset }] } as const satisfies ModelRecipe;
