import { ServicePackages } from "@rhs-ui/marketing/service-packages";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Three scoped packages from a studio: the price, the duration, what you get and what you have to bring, in rows that line up</p>
      <ServicePackages
        title="Fixed scope, fixed price"
        description="Pick the size of the problem. Each package has a start date, an end date and a list of what is delivered, so you know the cost before we begin."
        packages={[
          {
            id: "sprint",
            name: "Sprint",
            summary: "A focused answer to one question, with a prototype you can put in front of customers.",
            price: "€4,800",
            priceNote: "Fixed fee, excl. VAT",
            duration: "2 weeks",
            deliverables: ["One workshop day with your team", "A clickable prototype of the key flow", "Five customer interviews, summarised", "A written recommendation and next steps"],
            requirements: ["access to your analytics", "five customers we can speak to", "one decision-maker"],
            action: { label: "Book a sprint", href: "#sprint" },
          },
          {
            id: "build",
            name: "Build",
            summary: "A new product area designed, built and shipped, from first sketch to production.",
            price: "€18,500",
            from: true,
            priceNote: "Fixed per milestone, excl. VAT",
            duration: "8 weeks",
            deliverables: ["Everything in Sprint", "Production-ready design and front end", "Back-end integration with your systems", "Accessibility and performance review", "Launch support and two weeks of fixes"],
            requirements: ["a named product owner", "access to your repository and staging", "your brand assets and copy"],
            action: { label: "Plan a build", href: "#build" },
            featured: true,
          },
          {
            id: "partner",
            name: "Partner",
            summary: "A senior design and engineering pair on call, for teams that ship all year.",
            price: "€9,200",
            priceNote: "Per month, excl. VAT, cancel with 30 days' notice",
            duration: "3 months minimum",
            deliverables: ["Three days a week of design and engineering", "A shared roadmap, reviewed every month", "A weekly demo of what shipped", "Priority for urgent fixes"],
            requirements: ["a weekly slot with your product lead", "access to your tools"],
            action: { label: "Talk about a partnership", href: "#partner" },
          },
        ]}
        note="Prices exclude VAT. We invoice 50 percent at the start and 50 percent on delivery, payable within 14 days. If the scope changes, we agree the change in writing before any work on it begins."
      />
    </div>
  );
}
