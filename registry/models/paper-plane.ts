import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { paperPlaneAsset } from "./assets/paperPlane";
export const paperPlane = { name: "paper-plane", parts: [], assets: [{ url: paperPlaneAsset }] } as const satisfies ModelRecipe;
