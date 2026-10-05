import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { shoppingCartAsset } from "./assets/shoppingCart";
export const shoppingCart = { name: "shopping-cart", parts: [], assets: [{ url: shoppingCartAsset }] } as const satisfies ModelRecipe;
