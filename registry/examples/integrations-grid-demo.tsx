import { IconCalendar, IconCloud, IconCode, IconCreditCard, IconMail, IconMessage } from "@rhs-ui/icons";
import { IntegrationsGrid } from "@rhs-ui/marketing/integrations-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <IntegrationsGrid
        eyebrow="Integrations"
        title="Works with the tools you already pay for"
        description="Two-way sync, set up in a minute, no code."
        integrations={[
          { id: "mail", name: "Mail", category: "Inbox", description: "Turn any email into a task with its thread attached.", mark: <IconMail />, href: "#" },
          { id: "chat", name: "Team chat", category: "Messaging", description: "Get a digest in your channel, reply to update work.", mark: <IconMessage />, href: "#" },
          { id: "calendar", name: "Calendar", category: "Scheduling", description: "Deadlines and focus blocks in your calendar.", mark: <IconCalendar />, href: "#" },
          { id: "billing", name: "Billing", category: "Finance", description: "Invoice tracked time straight from a project.", mark: <IconCreditCard />, href: "#" },
          { id: "storage", name: "Cloud storage", category: "Files", description: "Link folders; files stay where they live.", mark: <IconCloud />, href: "#" },
          { id: "git", name: "Git hosting", category: "Engineering", description: "Pull requests move tasks to review on their own.", mark: <IconCode />, href: "#" },
        ]}
      />
    </div>
  );
}
