import type { ReactNode } from "react";

import { IngredientList, type Ingredient } from "@rhs-ui/application/ingredient-list";

/** In cups and spoons, for a kitchen that measures by volume: the amounts come out as fractions. */
const PANCAKES: readonly Ingredient[] = [
  { id: "flour", group: "For the batter", quantity: 1.5, unit: "cup", name: "all-purpose flour", note: "sifted" },
  { id: "sugar", group: "For the batter", quantity: 2, unit: "tbsp", name: "caster sugar" },
  { id: "baking-powder", group: "For the batter", quantity: 2, unit: "tsp", name: "baking powder" },
  { id: "salt", group: "For the batter", quantity: 0.5, unit: "tsp", name: "fine salt" },
  { id: "buttermilk", group: "For the batter", quantity: 1.25, unit: "cup", name: "buttermilk" },
  { id: "eggs", group: "For the batter", quantity: 2, name: "egg", plural: "eggs", note: "beaten" },
  { id: "butter", group: "For the batter", quantity: 3, unit: "tbsp", name: "unsalted butter", note: "melted, plus more for the pan" },
  { id: "blueberries", group: "To serve", quantity: 1, unit: "cup", name: "blueberries" },
  { id: "syrup", group: "To serve", name: "maple syrup", note: "to taste" },
];

/** In grams and millilitres, written for two and scaled to five: the amounts come out as decimals, and what is written in words ("a handful") stays. */
const LINGUINE: readonly Ingredient[] = [
  { id: "linguine", group: "For the pasta", quantity: 200, unit: "g", name: "dried linguine" },
  { id: "water-salt", group: "For the pasta", quantity: 1, unit: "tbsp", name: "coarse salt", note: "for the water" },
  { id: "oil", group: "For the sauce", quantity: 3, unit: "tbsp", name: "olive oil" },
  { id: "garlic", group: "For the sauce", quantity: 3, unit: "clove", name: "garlic", note: "thinly sliced" },
  { id: "tomatoes", group: "For the sauce", quantity: 400, unit: "g", name: "cherry tomatoes", note: "halved" },
  { id: "wine", group: "For the sauce", quantity: 100, unit: "ml", name: "dry white wine" },
  { id: "chilli", group: "For the sauce", quantity: 0.5, unit: "tsp", name: "chilli flakes" },
  { id: "parmesan", group: "For the sauce", quantity: 40, unit: "g", name: "parmesan", note: "finely grated" },
  { id: "basil", group: "For the sauce", quantity: "a handful", name: "basil leaves" },
  { id: "pepper", group: "For the sauce", name: "black pepper", note: "to taste" },
];

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      {/* A caption that wraps on one side must not push its card below the card beside it: from md the two share the height of two lines. */}
      <p className="mb-2.5 flex text-xs text-muted-foreground md:min-h-8 md:items-end">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl items-start gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Cups and spoons become fractions. Tick a line as you take it from the cupboard.">
        <IngredientList ingredients={PANCAKES} baseServings={4} checkable defaultChecked={["flour", "salt"]} labels={{ title: "Pancake ingredients" }} />
      </Case>

      <Case caption="Written for two, scaled to five: grams roll over to kilograms.">
        <IngredientList ingredients={LINGUINE} baseServings={2} defaultServings={5} labels={{ title: "Linguine ingredients" }} />
      </Case>
    </div>
  );
}
