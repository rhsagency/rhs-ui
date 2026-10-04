import { IconHome, IconSearch, IconCart, IconUser } from "@rhs-ui/icons";
import { BottomNav } from "@rhs-ui/primitives/bottom-nav";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto p-8">
      <div className="relative mx-auto h-[26rem] w-72 overflow-hidden rounded-[2rem] border border-border bg-muted/40">
        <div className="space-y-3 p-5">
          <div className="h-32 rounded-2xl bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
        <BottomNav
          className="absolute md:block"
          current="#home"
          items={[
            { href: "#home", label: "Home", icon: <IconHome className="size-5" /> },
            { href: "#search", label: "Search", icon: <IconSearch className="size-5" /> },
            { href: "#bag", label: "Bag", icon: <IconCart className="size-5" />, badge: 2 },
            { href: "#account", label: "Account", icon: <IconUser className="size-5" /> },
          ]}
        />
      </div>
    </div>
  );
}
