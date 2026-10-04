"use client";

import { useState } from "react";

import { IconRocket, IconTruck, IconZap } from "@rhs-ui/icons";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState("standard");
  return (
    <div className="mx-auto max-w-xl p-8">
      <RadioCards
        label="Delivery speed"
        value={value}
        onValueChange={setValue}
        options={[
          { value: "standard", title: "Standard", description: "2 to 3 working days", aside: "Free", icon: <IconTruck /> },
          { value: "express", title: "Express", description: "Tomorrow before 18:00", aside: "€4.95", icon: <IconZap /> },
          { value: "same-day", title: "Same day", description: "Order before 12:00, Amsterdam only", aside: "€9.95", icon: <IconRocket /> },
        ]}
      />
    </div>
  );
}
