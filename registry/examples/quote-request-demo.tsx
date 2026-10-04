"use client";

import { IconBathtub, IconBricks, IconPaintRoller, IconUtensils } from "@rhs-ui/icons";
import { QuoteRequest } from "@rhs-ui/marketing/quote-request";

export default function Demo(): React.JSX.Element {
  return (
    <div className="px-6">
      <QuoteRequest
        title="What does it cost? Ask us."
        description="A clear quote within two working days, without a sales visit unless you want one."
        services={[
          { value: "kitchen", label: "Kitchen", description: "Design, build and fitting", icon: <IconUtensils /> },
          { value: "bathroom", label: "Bathroom", description: "Including tiling", icon: <IconBathtub /> },
          { value: "plaster", label: "Plastering", description: "Walls and ceilings", icon: <IconPaintRoller /> },
          { value: "masonry", label: "Masonry", description: "Repairs and new walls", icon: <IconBricks /> },
        ]}
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 600))}
        note="We use your details only for this quote."
      />
    </div>
  );
}
