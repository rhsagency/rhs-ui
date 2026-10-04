"use client";

import { MenuSection } from "@rhs-ui/marketing/menu-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="px-6">
      <MenuSection
        title="Menu"
        legend={{ V: "Vegetarian", VG: "Vegan", GF: "Gluten-free" }}
        footnote="Allergies? Tell us when you order; the kitchen adapts most dishes."
        courses={[
          { id: "starters", title: "Starters", dishes: [{ name: "Beetroot, goat's cheese, hazelnut", description: "Roasted and raw beetroot, whipped goat's cheese, brown butter.", price: "€12", tags: ["V", "GF"] }, { name: "Smoked mackerel", description: "Horseradish cream, pickled cucumber, rye crumb.", price: "€14" }] },
          { id: "mains", title: "Mains", dishes: [{ name: "Celeriac steak", description: "Salt-baked, mushroom jus, crispy kale.", price: "€22", tags: ["VG", "GF"] }, { name: "North Sea cod", description: "Mussels, leek, beurre blanc.", price: "€27" }] },
          { id: "desserts", title: "Desserts", dishes: [{ name: "Apple tarte tatin", description: "Vanilla ice cream, salted caramel.", price: "€10", tags: ["V"] }] },
        ]}
      />
    </div>
  );
}
