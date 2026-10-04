import { IconBell, IconCart, IconMail } from "@rhs-ui/icons";
import { NotificationBadge } from "@rhs-ui/primitives/notification-badge";

const button = "inline-flex size-11 items-center justify-center rounded-full border border-border bg-background text-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md items-center justify-center gap-8 p-10">
      <NotificationBadge label="unread messages" count={3}>
        <button type="button" className={button} aria-label="Messages"><IconMail className="size-5" /></button>
      </NotificationBadge>
      <NotificationBadge label="notifications" count={128}>
        <button type="button" className={button} aria-label="Notifications"><IconBell className="size-5" /></button>
      </NotificationBadge>
      <NotificationBadge label="items in your bag" count={1} dot>
        <button type="button" className={button} aria-label="Bag"><IconCart className="size-5" /></button>
      </NotificationBadge>
    </div>
  );
}
