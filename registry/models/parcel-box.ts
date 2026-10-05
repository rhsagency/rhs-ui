import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { parcelBoxAsset } from "./assets/parcelBox";
export const parcelBox = { name: "parcel-box", parts: [], assets: [{ url: parcelBoxAsset }] } as const satisfies ModelRecipe;
