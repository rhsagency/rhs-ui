"use client";

import { IconCheck, IconMail, IconUser } from "@rhs-ui/icons";
import { NotificationList } from "@rhs-ui/application/notification-list";

const ITEMS = [
  { id: "1", group: "Today", title: <><strong className="font-medium">Priya</strong> invited you to Launch plan</>, time: "12 min ago", unread: true, icon: <IconUser />, href: "#notifications" },
  { id: "2", group: "Today", title: "Invoice INV-2041 was paid", time: "2 h ago", unread: true, icon: <IconCheck /> },
  { id: "3", group: "Today", title: <><strong className="font-medium">Jonas</strong> replied to your comment</>, time: "4 h ago", icon: <IconMail /> },
  { id: "4", group: "Earlier", title: "Your export is ready to download", time: "Yesterday", icon: <IconCheck /> },
  { id: "5", group: "Earlier", title: <><strong className="font-medium">Mei</strong> joined the workspace</>, time: "Mon", icon: <IconUser /> },
];

export default function NotificationListDemo() {
  return <NotificationList items={ITEMS} className="w-full max-w-sm rounded-xl border border-border p-3" />;
}
