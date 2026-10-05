import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { graduationCapAsset } from "./assets/graduationCap";
export const graduationCap = { name: "graduation-cap", parts: [], assets: [{ url: graduationCapAsset }] } as const satisfies ModelRecipe;
