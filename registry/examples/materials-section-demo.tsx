import type { ReactNode } from "react";

import { MaterialsSection } from "@rhs-ui/marketing/materials-section";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="A garment's composition: the story and the care on the left, and on the right each material with its swatch, its share, where it comes from and what certifies it. The shares add up to 100">
        <MaterialsSection
          eyebrow="Materials"
          title="Made slowly, from fibres we can name"
          story={
            <>
              <p>The Kestrel overshirt starts as organic cotton from the Aegean coast and is woven with Normandy linen at a family mill in Biella, Italy, which has run on its own water power since 1923.</p>
              <p>We use the same four materials in every colour, and we say where each one comes from, because you should not have to take our word for it.</p>
            </>
          }
          materials={[
            { name: "Organic cotton", share: 62, origin: "Aegean region, Türkiye", certification: "GOTS organic", swatch: "#e7dfd0" },
            { name: "Linen", share: 30, origin: "Normandy, France", certification: "OEKO-TEX Standard 100", swatch: "#c9ba9c" },
            { name: "Recycled polyester", share: 6, origin: "Prato, Italy", certification: "Global Recycled Standard", swatch: "#8d9aa3" },
            { name: "Corozo buttons", share: 2, origin: "Guayaquil, Ecuador", swatch: "#6b5844" },
          ]}
          care={["Wash at 30 °C with similar colours", "Line dry in the shade", "Iron while damp, on a medium heat", "Do not tumble dry or bleach"]}
        />
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="The same block for a cosmetic, in a narrow column: the two halves stack, the care list is renamed Storage, and two of the four materials carry no certification">
          <MaterialsSection
            headingLevel={3}
            title="What is in the tube"
            story="Four ingredients and nothing else. The shea is bought from a women's cooperative in Burkina Faso at a price they set."
            materials={[
              { name: "Spring water", share: 58, origin: "Vosges, France", swatch: "#cfe0e4" },
              { name: "Shea butter", share: 24, origin: "Léo, Burkina Faso", certification: "Fairtrade", swatch: "#eadfba" },
              { name: "Jojoba oil", share: 12, origin: "Andalusia, Spain", certification: "COSMOS Organic", swatch: "#d9c27a" },
              { name: "Beeswax", share: 6, origin: "Drenthe, Netherlands", swatch: "#c19a4f" },
            ]}
            care={["Keep below 25 °C", "Use within 12 months of opening"]}
            labels={{ care: "Storage" }}
          />
        </Example>
      </div>
    </div>
  );
}
