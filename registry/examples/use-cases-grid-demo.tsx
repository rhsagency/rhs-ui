import { IconBriefcase, IconBuilding, IconCode, IconGraduationCap, IconMegaphone, IconStore } from "@rhs-ui/icons";
import { UseCasesGrid } from "@rhs-ui/marketing/use-cases-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <UseCasesGrid
        title="Built for teams like yours."
        description="Same product, set up for the way your kind of team already works."
        cases={[
          { href: "#agencies", icon: <IconBriefcase />, audience: "Agencies", title: "Every client in its own space", description: "Share progress with clients without sharing your internal notes." },
          { href: "#product", icon: <IconCode />, audience: "Product teams", title: "From roadmap to release", description: "Plan in quarters, ship in weeks, write the changelog from the work." },
          { href: "#marketing", icon: <IconMegaphone />, audience: "Marketing", title: "Campaigns on one calendar", description: "Briefs, assets and launch dates where everyone can see them." },
          { href: "#retail", icon: <IconStore />, audience: "Retail", title: "Store openings on schedule", description: "A checklist per location that head office can follow live." },
          { href: "#education", icon: <IconGraduationCap />, audience: "Education", title: "Courses that run themselves", description: "Lesson plans, deadlines and grading in one shared term plan." },
          { href: "#enterprise", icon: <IconBuilding />, audience: "Enterprise", title: "Portfolio view for leadership", description: "Every programme rolled up, with the risks called out." },
        ]}
      />
    </div>
  );
}
