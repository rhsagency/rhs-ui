import { IconBoard, IconChart, IconFolder, IconGrid, IconInbox, IconSettings, IconUsers } from "@rhs-ui/icons";
import { SidebarNav } from "@rhs-ui/primitives/sidebar-nav";

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-60 rounded-xl border border-border bg-muted/50 p-3">
      <SidebarNav
        currentHref="/projects"
        groups={[
          {
            links: [
              { href: "/dashboard", label: "Dashboard", icon: <IconGrid /> },
              { href: "/inbox", label: "Inbox", icon: <IconInbox />, badge: "12" },
              { href: "/projects", label: "Projects", icon: <IconFolder /> },
              { href: "/board", label: "Board", icon: <IconBoard />, badge: "New" },
            ],
          },
          { label: "Reports", collapsible: true, links: [{ href: "/reports/revenue", label: "Revenue", icon: <IconChart /> }, { href: "/reports/team", label: "Team load", icon: <IconUsers /> }] },
          { label: "Workspace", links: [{ href: "/settings", label: "Settings", icon: <IconSettings /> }] },
        ]}
      />
    </div>
  );
}
