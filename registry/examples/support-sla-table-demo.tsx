import { SupportSlaTable } from "@rhs-ui/marketing/support-sla-table";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SupportSlaTable
        caption="Response and resolution targets by plan"
        hours={{ label: "Monday to Friday, 09:00 to 17:00", timeZone: "Europe/Amsterdam" }}
        priorities={[
          { name: "Critical", definition: "Production is down or data is at risk, and there is no workaround." },
          { name: "High", definition: "A core feature is broken for many people, but there is a workaround." },
          { name: "Normal", definition: "Something works wrongly, or a question is blocking your team." },
          { name: "Low", definition: "A suggestion, a how-to question or a cosmetic issue." },
        ]}
        plans={[
          {
            name: "Standard",
            description: "For small teams",
            href: "#standard",
            rows: [
              { response: "4 hours", resolution: "2 business days" },
              { response: "Next business day", resolution: "4 business days" },
              { response: "2 business days", resolution: "Best effort" },
              null,
            ],
            channels: ["Email"],
          },
          {
            name: "Business",
            description: "For growing companies",
            href: "#business",
            rows: [
              { response: "1 hour", resolution: "8 hours" },
              { response: "4 hours", resolution: "2 business days" },
              { response: "1 business day", resolution: "5 business days" },
              { response: "2 business days", resolution: "Best effort" },
            ],
            channels: ["Email", "Chat"],
            hours: { label: "Monday to Friday, 08:00 to 20:00", timeZone: "Europe/Amsterdam" },
          },
          {
            name: "Enterprise",
            description: "With a named engineer",
            href: "#enterprise",
            rows: [
              { response: "15 minutes", resolution: "4 hours" },
              { response: "1 hour", resolution: "1 business day" },
              { response: "4 hours", resolution: "3 business days" },
              { response: "1 business day", resolution: "Next release" },
            ],
            channels: ["Email", "Chat", "Phone"],
            hours: { label: "24 hours a day, every day" },
          },
        ]}
        notes={[
          "Times run in business hours, Monday to Friday and excluding public holidays in the Netherlands. Critical and High cases on Enterprise run in calendar hours, around the clock.",
          "A target resolution is a goal we commit to work towards, not a promise that every case is closed in that time. We keep you updated until it is.",
        ]}
      />
    </div>
  );
}
