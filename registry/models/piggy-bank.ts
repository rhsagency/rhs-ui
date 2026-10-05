import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { piggyBankAsset } from "./assets/piggyBank";
export const piggyBank = { name: "piggy-bank", parts: [], assets: [{ url: piggyBankAsset }] } as const satisfies ModelRecipe;
