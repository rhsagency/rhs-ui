"use client";

import { IconBook, IconChartBar, IconFileText, IconVideo } from "@rhs-ui/icons";
import { ResourceLibrary } from "@rhs-ui/marketing/resource-library";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ResourceLibrary
        title="Resources"
        description="Everything we have written, recorded and measured, free to use."
        resources={[
          { href: "#roadmap-guide", type: "Guide", icon: <IconBook />, title: "The calm roadmap", description: "Plan a quarter without the all-day workshop." },
          { href: "#okr-template", type: "Template", icon: <IconFileText />, title: "OKR template for small teams", description: "Three objectives, nine key results, one page." },
          { href: "#webinar-async", type: "Webinar", icon: <IconVideo />, title: "Async updates that people read", description: "A 40-minute session with three team leads." },
          { href: "#report-2026", type: "Report", icon: <IconChartBar />, title: "State of small teams 2026", description: "Survey of 1,200 teams on tools, meetings and focus." },
          { href: "#retro-template", type: "Template", icon: <IconFileText />, title: "Retro in 30 minutes", description: "A format that ends with decisions, not feelings." },
          { href: "#hiring-guide", type: "Guide", icon: <IconBook />, title: "Hiring your first designer", description: "What to look for and what the first month holds." },
        ]}
      />
    </div>
  );
}
