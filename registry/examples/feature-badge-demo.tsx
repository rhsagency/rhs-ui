import { IconChartBar, IconHome, IconInbox, IconSparkle } from "@rhs-ui/icons";
import { FeatureBadge } from "@rhs-ui/primitives/feature-badge";

export default function Demo(): React.JSX.Element {
  const item = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground";
  return (
    <nav aria-label="Workspace" className="mx-auto w-60 p-8">
      <ul className="grid gap-0.5">
        <li><a href="#home" className={item}><IconHome />Home</a></li>
        <li><a href="#inbox" className={item}><IconInbox />Inbox</a></li>
        <li><a href="#reports" className={item}><IconChartBar /><FeatureBadge kind="new">Reports</FeatureBadge></a></li>
        <li><a href="#assistant" className={item}><IconSparkle /><FeatureBadge kind="beta">Assistant</FeatureBadge></a></li>
        <li><span className={`${item} cursor-default text-muted-foreground hover:bg-transparent`}><IconSparkle /><FeatureBadge kind="soon">Automations</FeatureBadge></span></li>
      </ul>
    </nav>
  );
}
