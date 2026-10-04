"use client";

import { IconCalendar, IconFolder, IconHome, IconMail, IconMessage, IconMusic, IconSettings } from "@rhs-ui/icons";
import { Dock } from "@rhs-ui/motion/dock";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex min-h-64 items-end justify-center p-10">
      <Dock
        items={[
          { id: "home", label: "Home", icon: <IconHome />, active: true },
          { id: "mail", label: "Mail", icon: <IconMail />, active: true },
          { id: "chat", label: "Messages", icon: <IconMessage /> },
          { id: "calendar", label: "Calendar", icon: <IconCalendar /> },
          { id: "files", label: "Files", icon: <IconFolder /> },
          { id: "music", label: "Music", icon: <IconMusic /> },
          { id: "settings", label: "Settings", icon: <IconSettings /> },
        ]}
      />
    </div>
  );
}
