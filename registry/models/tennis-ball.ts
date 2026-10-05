import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { tennisBallAsset } from "./assets/tennisBall";
export const tennisBall = { name: "tennis-ball", parts: [], assets: [{ url: tennisBallAsset }] } as const satisfies ModelRecipe;
