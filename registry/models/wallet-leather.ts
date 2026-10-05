import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { walletLeatherAsset } from "./assets/walletLeather";
export const walletLeather = { name: "wallet-leather", parts: [], assets: [{ url: walletLeatherAsset }] } as const satisfies ModelRecipe;
