"use client";

import { IconBook, IconBriefcase, IconChartBar, IconCode, IconLayers, IconMegaphone, IconRocket, IconWorkflow } from "@rhs-ui/icons";
import { MegaMenu } from "@rhs-ui/primitives/mega-menu";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex min-h-[28rem] max-w-5xl items-start gap-6 p-6">
      <span className="inline-flex h-9 items-center gap-2 font-medium"><IconLayers className="size-5" />Ledger</span>
      <MegaMenu
        sections={[
          {
            label: "Product",
            columns: [
              { title: "Plan", links: [{ label: "Roadmaps", href: "#roadmaps", description: "Outcomes the company can read.", icon: <IconRocket /> }, { label: "Cycles", href: "#cycles", description: "Two-week sprints that stay honest.", icon: <IconWorkflow /> }] },
              { title: "Measure", links: [{ label: "Reports", href: "#reports", description: "Throughput, without a spreadsheet.", icon: <IconChartBar /> }, { label: "API", href: "#api", description: "Everything, scriptable.", icon: <IconCode /> }] },
            ],
            featured: { eyebrow: "New", title: "Releases that write their own notes", description: "Group finished work and publish the changelog.", href: "#releases" },
          },
          {
            label: "Solutions",
            columns: [{ links: [{ label: "Agencies", href: "#agencies", description: "Client work, shared calmly.", icon: <IconBriefcase /> }, { label: "Marketing teams", href: "#marketing", description: "Campaigns on one calendar.", icon: <IconMegaphone /> }] }, { links: [{ label: "Guides", href: "#guides", description: "How teams set it up.", icon: <IconBook /> }] }],
          },
          { label: "Pricing", href: "#pricing" },
        ]}
      />
    </div>
  );
}
