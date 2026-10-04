import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { keyRingAsset } from "./assets/keyRing";
export const keyRing = { name: "key-ring", parts: [], assets: [{ url: keyRingAsset }] } as const satisfies ModelRecipe;
