"use client";

import { PricingPage } from "@rhs-ui/templates/pricing-page";

/** A plan choice in the demo: say what was chosen, next to the pricing. */
const announcePlan = (id: string, interval: string) => {
  document.getElementById("plan-status")?.remove();
  const status = document.createElement("p");
  status.id = "plan-status";
  status.setAttribute("role", "status");
  status.textContent = `Selected ${id}, billed ${interval}. Demo only.`;
  document.querySelector('[data-slot="pricing-section"]')?.append(status);
};

export default function Demo(): React.JSX.Element {
  return <PricingPage onSelectPlan={announcePlan} />;
}
