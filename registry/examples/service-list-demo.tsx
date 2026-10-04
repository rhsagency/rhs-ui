import { ServiceList } from "@rhs-ui/marketing/service-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <ServiceList
        title="What we do"
        description="Kitchens, bathrooms and renovations in and around Veenendaal, from the first sketch to the last tile."
        services={[
          { href: "#kitchens", title: "Kitchens", description: "Made to measure, from design to fitting, including appliances.", price: "From €8,500" },
          { href: "#bathrooms", title: "Bathrooms", description: "Complete renovations with tiling, plumbing and lighting.", price: "From €6,900" },
          { href: "#verandas", title: "Verandas", description: "Wooden or aluminium, with glass walls or open sides.", price: "From €4,200" },
          { href: "#renovation", title: "Renovation", description: "Walls, floors and the parts of a house nobody else wants to touch.", price: "Quote on request" },
        ]}
      />
    </div>
  );
}
