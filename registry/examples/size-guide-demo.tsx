"use client";

import { SizeGuide } from "@rhs-ui/commerce/size-guide";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md justify-center p-10">
      <SizeGuide
        measures={["Chest", "Waist", "Length"]}
        sizes={[
          { size: "S", cm: [92, 78, 70] },
          { size: "M", cm: [100, 86, 72] },
          { size: "L", cm: [108, 94, 74] },
          { size: "XL", cm: [116, 102, 76] },
        ]}
        howTo={["Chest: around the fullest part, under the arms.", "Waist: around your natural waistline.", "Length: from the top of the shoulder down."]}
      />
    </div>
  );
}
