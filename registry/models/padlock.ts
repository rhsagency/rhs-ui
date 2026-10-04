import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { padlockAsset } from "./assets/padlock";
export const padlock = { name: "padlock", parts: [], assets: [{ url: padlockAsset }] } as const satisfies ModelRecipe;
