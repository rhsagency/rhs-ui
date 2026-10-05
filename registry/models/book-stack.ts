import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { bookStackAsset } from "./assets/bookStack";
export const bookStack = { name: "book-stack", parts: [], assets: [{ url: bookStackAsset }] } as const satisfies ModelRecipe;
