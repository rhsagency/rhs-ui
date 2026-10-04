import { IconCalendar, IconChart, IconFolder, IconInbox, IconMessages, IconReceipt } from "@rhs-ui/icons";
import { AppSwitcher } from "@rhs-ui/primitives/app-switcher";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex min-h-64 max-w-md items-start justify-center p-10">
      <AppSwitcher
        current="mail"
        apps={[
          { id: "mail", name: "Mail", href: "#", icon: <IconInbox className="size-5" /> },
          { id: "calendar", name: "Calendar", href: "#", icon: <IconCalendar className="size-5" /> },
          { id: "files", name: "Files", href: "#", icon: <IconFolder className="size-5" /> },
          { id: "chat", name: "Chat", href: "#", icon: <IconMessages className="size-5" /> },
          { id: "billing", name: "Billing", href: "#", icon: <IconReceipt className="size-5" />, hint: "Admin" },
          { id: "insights", name: "Insights", href: "#", icon: <IconChart className="size-5" /> },
        ]}
      />
    </div>
  );
}
