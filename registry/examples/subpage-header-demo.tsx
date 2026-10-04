import { SubpageHeader } from "@rhs-ui/marketing/subpage-header";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SubpageHeader
        titleAs="h2"
        breadcrumbs={[{ label: "Home", href: "#home" }, { label: "Resources", href: "#resources" }, { label: "Guides" }]}
        title="Guides"
        description="Step-by-step write-ups for the things teams ask us about most."
      >
        <ul className="flex flex-wrap gap-2 text-sm">
          {["Planning", "Meetings", "Hiring", "Remote work"].map((topic) => (
            <li key={topic}><a href={`#${topic.toLowerCase().replace(" ", "-")}`} className="inline-flex rounded-full border border-border bg-background px-3 py-1 hover:bg-muted">{topic}</a></li>
          ))}
        </ul>
      </SubpageHeader>
    </div>
  );
}
