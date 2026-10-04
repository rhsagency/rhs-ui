import { IconCalendar, IconCloud, IconCode, IconCreditCard, IconDatabase, IconMail, IconMessage, IconSparkle } from "@rhs-ui/icons";
import { OrbitItems } from "@rhs-ui/motion/orbit-items";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex justify-center p-10">
      <OrbitItems
        center={<span className="[&_svg]:size-8"><IconSparkle /></span>}
        items={[
          { id: "mail", label: "Mail", node: <IconMail /> },
          { id: "chat", label: "Chat", node: <IconMessage /> },
          { id: "calendar", label: "Calendar", node: <IconCalendar /> },
          { id: "billing", label: "Billing", node: <IconCreditCard /> },
          { id: "storage", label: "Storage", node: <IconCloud /> },
          { id: "database", label: "Database", node: <IconDatabase /> },
          { id: "git", label: "Git", node: <IconCode /> },
        ]}
      />
    </div>
  );
}
