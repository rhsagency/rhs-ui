import { ServiceLevels } from "@rhs-ui/marketing/service-levels";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Response times and uptime targets side by side on a wide block, each priority defined in a sentence</p>
      <ServiceLevels
        eyebrow="Service levels"
        title="Commitments you can hold us to"
        description="No “24/7 support” and no “best effort”. These are the numbers in your contract, with what we owe you when we miss them."
        slaHref="#sla"
        hours="P1 runs around the clock, every day of the year. P2 and P3 run on business days from 08:00 to 18:00 in Amsterdam."
        support={[
          {
            priority: "P1",
            name: "Critical",
            definition: "Production is down for most of your users, or their data is at risk, with no workaround.",
            firstResponse: "15 minutes",
            updates: "Every hour",
            channels: ["Phone", "Chat", "Email"],
          },
          {
            priority: "P2",
            name: "High",
            definition: "A core feature is broken or badly slow for many users, but a workaround exists.",
            firstResponse: "2 hours",
            updates: "Every 8 hours",
            channels: ["Chat", "Email"],
          },
          {
            priority: "P3",
            name: "Normal",
            definition: "Something misbehaves for a few users, or a question is holding your team up.",
            firstResponse: "1 business day",
            updates: "Every 2 business days",
            channels: ["Email"],
          },
        ]}
        availability={[
          { plan: "Enterprise", target: "99.99%", downtimePerMonth: "4 min 23 s", credit: "25% of the month's fee" },
          { plan: "Business", target: "99.95%", downtimePerMonth: "21 min 55 s", credit: "10% of the month's fee" },
          { plan: "Starter", target: "99.9%", downtimePerMonth: "43 min 50 s", credit: "5% of the month's fee" },
        ]}
      />

      <p className="mt-20 mb-8 text-xs text-muted-foreground">A narrow column with one uptime target and no plan names: each table becomes a list of cards under its title</p>
      <div className="max-w-md">
        <ServiceLevels
          headingLevel={3}
          title="Our commitments"
          support={[
            { priority: "P1", name: "Urgent", definition: "The service is unavailable to everyone and nothing you can do brings it back.", firstResponse: "30 minutes", updates: "Every 2 hours", channels: "Phone and email" },
            { priority: "P2", name: "Standard", definition: "Anything else, from a bug to a how-to question.", firstResponse: "1 business day", updates: "Every 3 business days", channels: "Email" },
          ]}
          availability={[{ target: "99.9%", downtimePerMonth: "43 min 50 s", credit: "10% of the month's fee" }]}
        />
      </div>
    </div>
  );
}
