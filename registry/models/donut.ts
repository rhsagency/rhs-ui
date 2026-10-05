import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { donutAsset } from "./assets/donut";
export const donut = { name: "donut", parts: [], assets: [{ url: donutAsset }] } as const satisfies ModelRecipe;
