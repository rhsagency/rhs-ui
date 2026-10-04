"use client";

import { IconLayers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { MobileMenu } from "@rhs-ui/primitives/mobile-menu";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-sm p-6">
      <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-2">
        <span className="inline-flex items-center gap-2 font-medium"><IconLayers className="size-5" />Ledger</span>
        <MobileMenu
          brand={<span className="inline-flex items-center gap-2"><IconLayers className="size-5" />Ledger</span>}
          current="#pricing"
          groups={[
            { label: "Product", links: [{ label: "Roadmaps", href: "#roadmaps", description: "Plan the quarter" }, { label: "Cycles", href: "#cycles", description: "Run two-week sprints" }, { label: "Decisions", href: "#decisions", description: "Keep the why" }] },
            { label: "Solutions", links: [{ label: "Agencies", href: "#agencies" }, { label: "Product teams", href: "#product-teams" }] },
            { label: "Pricing", href: "#pricing" },
            { label: "Blog", href: "#blog" },
          ]}
          actions={<><Button size="lg">Start for free</Button><Button size="lg" variant="outline">Sign in</Button></>}
        />
      </div>
    </div>
  );
}
