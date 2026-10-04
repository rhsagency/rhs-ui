import { PagerNav } from "@rhs-ui/primitives/pager-nav";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <PagerNav noun="Guide" previous={{ href: "#install", title: "Install and add the theme" }} next={{ href: "#forms", title: "Build your first form" }} />
    </div>
  );
}
