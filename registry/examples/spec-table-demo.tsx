import { SpecTable } from "@rhs-ui/primitives/spec-table";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <SpecTable
        groups={[
          { title: "Size and weight", rows: [{ label: "Height", value: "32 cm" }, { label: "Width", value: "18 cm" }, { label: "Weight", value: "1.4 kg" }] },
          { title: "Materials", rows: [{ label: "Body", value: "Recycled aluminium" }, { label: "Shade", value: "Linen, washable" }, { label: "Cable", value: "Braided, 2 m" }] },
          { title: "Light", rows: [{ label: "Bulb", value: "E27 LED, included" }, { label: "Colour", value: "2700 K, warm white" }, { label: "Dimmable", value: "Yes, by touch" }] },
          { title: "In the box", rows: [{ label: "Contents", value: "Lamp, bulb, plug" }, { label: "Warranty", value: "5 years" }] },
        ]}
      />
    </div>
  );
}
