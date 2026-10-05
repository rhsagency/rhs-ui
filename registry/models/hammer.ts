import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { hammerAsset } from "./assets/hammer";
export const hammer = { name: "hammer", parts: [], assets: [{ url: hammerAsset }] } as const satisfies ModelRecipe;
