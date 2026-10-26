import { AllergenMatrix, type AllergenDish } from "@rhs-ui/marketing/allergen-matrix";

const DISHES: readonly AllergenDish[] = [
  { course: "Starters", name: "Burrata, roasted tomatoes, basil oil", contains: ["milk"], mayContain: ["gluten", "nuts"] },
  { course: "Starters", name: "Beetroot carpaccio, hazelnuts, goat’s cheese", contains: ["nuts", "milk", "sulphites"], mayContain: ["gluten", "mustard"] },
  { course: "Starters", name: "Prawn cocktail, Marie Rose, little gem", contains: ["crustaceans", "eggs", "mustard", "sulphites"], mayContain: ["fish", "molluscs"] },
  { course: "Starters", name: "Mussels in white wine and parsley", contains: ["molluscs", "milk", "celery", "sulphites"], mayContain: ["crustaceans", "fish"] },
  { course: "Starters", name: "French onion soup, gruyère crouton", contains: ["gluten", "milk", "celery", "sulphites"], mayContain: ["mustard"] },
  { course: "Mains", name: "Roast cod, leeks, brown butter", contains: ["fish", "milk", "sulphites"], mayContain: ["crustaceans", "molluscs", "gluten"] },
  { course: "Mains", name: "Sirloin steak, béarnaise, frites", contains: ["eggs", "milk", "mustard", "sulphites"], mayContain: ["gluten", "celery"] },
  { course: "Mains", name: "Wild mushroom risotto", contains: ["milk", "celery", "sulphites"], mayContain: ["gluten"] },
  { course: "Mains", name: "Lamb shoulder, harissa, couscous", contains: ["gluten", "sesame", "celery"], mayContain: ["nuts", "milk", "peanuts"] },
  { course: "Mains", name: "Miso aubergine, sesame rice", contains: ["soya", "sesame", "gluten"], mayContain: ["peanuts", "fish"] },
  { course: "Desserts", name: "Crème brûlée, shortbread", contains: ["eggs", "milk", "gluten"], mayContain: ["nuts"] },
  { course: "Desserts", name: "Dark chocolate fondant", contains: ["gluten", "eggs", "milk", "soya"], mayContain: ["nuts", "peanuts"] },
  { course: "Desserts", name: "Lemon sorbet", mayContain: ["milk"] },
  { course: "Desserts", name: "Apple tart, almond cream", contains: ["gluten", "eggs", "milk", "nuts"], mayContain: ["peanuts"] },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:py-16">
      <AllergenMatrix
        title="Allergens"
        description="Every dish on our autumn menu against the fourteen allergens we are required to declare. Pick what you cannot eat and the list narrows to what is safe to order."
        dishes={DISHES}
        locale="en-GB"
        updated="2026-10-12"
        legend="May contain means the recipe has no such ingredient, but the dish is prepared on shared equipment or a supplier warns about traces."
        note="Allergic or intolerant? Tell your server before you order. Our kitchen handles all fourteen allergens, so we can never promise that a dish is free from traces."
      />

      <div className="mt-24 border-t border-border pt-12">
        <p className="mb-8 text-xs text-muted-foreground">With nuts and peanuts picked: seven dishes are left, and the count says so</p>
        <AllergenMatrix headingLevel={3} title="For a nut allergy" dishes={DISHES} defaultValue={["nuts", "peanuts"]} locale="en-GB" />
      </div>
    </div>
  );
}
