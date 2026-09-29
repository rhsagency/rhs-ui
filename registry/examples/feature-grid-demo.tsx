import { IconBell, IconChart, IconGitBranch, IconLock, IconSparkle, IconUsers } from "@rhs-ui/icons";
import { FeatureGrid } from "@rhs-ui/marketing/feature-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FeatureGrid
        eyebrow="What you get"
        title="Everything a studio plans, in one calm place."
        description="Six things that replace the spreadsheet, the chat thread and the Friday status meeting."
        features={[
          { id: "plans", icon: <IconChart />, title: "Plans that update themselves", description: "Dates move when the work moves, and everyone sees the same version." },
          { id: "reviews", icon: <IconSparkle />, title: "Reviews in context", description: "Comment on the work itself, not on a screenshot of it." },
          { id: "branches", icon: <IconGitBranch />, title: "Branches for ideas", description: "Try a direction without breaking the plan everyone relies on." },
          { id: "team", icon: <IconUsers />, title: "Built for small teams", description: "Two to twenty people, without an admin to keep it running." },
          { id: "quiet", icon: <IconBell />, title: "Quiet by default", description: "One digest a day, and a nudge only when something waits on you." },
          { id: "private", icon: <IconLock />, title: "Private by design", description: "Your work stays in the EU, and is never used to train anything." },
        ]}
      />
    </div>
  );
}
