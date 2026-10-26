import { RoadmapColumns } from "@rhs-ui/marketing/roadmap-columns";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="mb-6 text-xs text-muted-foreground">Four horizons, with a title, a link to what has shipped and the built-in footnote</p>
      <RoadmapColumns
        title="What we are building at Halcyon"
        description="The work we have chosen, in the order we expect to get to it. Vote or comment on any card that has an arrow."
        shippedHref="#changelog"
        columns={[
          {
            id: "now",
            title: "Now",
            description: "In the team's hands this quarter",
            items: [
              { title: "Single sign-on with SAML", summary: "Security reviews stall without it, and every team ends up managing passwords twice.", tag: "Security", status: "In progress" },
              { title: "Scheduled report emails", summary: "Send Monday's numbers to the people who never open the dashboard.", tag: "Reporting", status: "In progress", href: "#scheduled-reports" },
              { title: "Faster imports for large files", summary: "A 2 GB export should take minutes, not an afternoon.", tag: "Performance", status: "In progress" },
            ],
          },
          {
            id: "next",
            title: "Next",
            description: "Designed, and waiting for a free pair of hands",
            items: [
              { title: "A public API for events", summary: "Let teams send their own events without adding a tracking snippet.", tag: "Developers", status: "Designing", href: "#events-api" },
              { title: "Dashboard folders", summary: "Once a workspace has forty dashboards, they need somewhere to live.", tag: "Workspace", status: "Designing" },
              { title: "Slack alerts for thresholds", summary: "Hear about a drop in sign-ups when it happens, not on Monday.", tag: "Integrations", status: "Designing", href: "#slack-alerts" },
            ],
          },
          {
            id: "later",
            title: "Later",
            description: "Worth doing, not yet planned",
            items: [
              { title: "Warehouse sync", summary: "Query the same numbers from your own database, with your own tools.", tag: "Integrations", status: "Exploring" },
              { title: "A mobile app", summary: "Check one number on the train without pinching a desktop page.", tag: "Mobile", status: "Exploring" },
              { title: "Custom roles", summary: "Give finance read access to revenue and nothing else.", tag: "Security", status: "Exploring", href: "#custom-roles" },
            ],
          },
          {
            id: "shipped",
            title: "Shipped",
            description: "Done in the last three months",
            items: [
              { title: "Dark mode", summary: "Easier on the eyes for the late shift, and it follows your system setting.", tag: "Workspace", status: "Shipped" },
              { title: "CSV export for every table", summary: "Any table on any dashboard, filtered the way you see it.", tag: "Reporting", status: "Shipped" },
              { title: "Audit log", summary: "See who changed what and when, kept for twelve months.", tag: "Security", status: "Shipped" },
            ],
          },
        ]}
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">Three horizons without a title, a column with nothing in it yet, and a note of its own</p>
      <RoadmapColumns
        headingLevel={3}
        note="Plans change. We update this board on the first Monday of every month."
        columns={[
          {
            id: "now",
            title: "Now",
            items: [
              { title: "Shared calendars", summary: "One schedule for the whole kitchen, not one per person.", tag: "Planning", status: "In progress" },
              { title: "Allergen labels on prep lists", summary: "The warning travels with the recipe, from the pass to the printer.", tag: "Safety", status: "In progress", href: "#allergens" },
            ],
          },
          {
            id: "next",
            title: "Next",
            items: [{ title: "Supplier price alerts", summary: "A line goes up by more than 8 percent and you hear about it before the order goes out.", tag: "Purchasing", status: "Designing" }],
          },
          { id: "later", title: "Later", items: [] },
        ]}
      />
    </div>
  );
}
