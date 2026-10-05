import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { cupcakeAsset } from "./assets/cupcake";
export const cupcake = { name: "cupcake", parts: [], assets: [{ url: cupcakeAsset }] } as const satisfies ModelRecipe;
