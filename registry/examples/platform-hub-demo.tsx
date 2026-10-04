import { IconCalendar, IconCloud, IconCreditCard, IconDatabase, IconLayers, IconMail, IconMessages, IconReceipt, IconTerminal } from "@rhs-ui/icons";
import { PlatformHub } from "@rhs-ui/marketing/platform-hub";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <PlatformHub
        title="One place, connected to the tools you already pay for."
        description="Two-way sync with the apps your team lives in, so nobody copies a status by hand again."
        center={<IconLayers />}
        centerLabel="Ledger"
        spokes={[
          { name: "Calendar", icon: <IconCalendar /> },
          { name: "Email", icon: <IconMail /> },
          { name: "Chat", icon: <IconMessages /> },
          { name: "Payments", icon: <IconCreditCard /> },
          { name: "Invoicing", icon: <IconReceipt /> },
          { name: "Storage", icon: <IconCloud /> },
          { name: "Data warehouse", icon: <IconDatabase /> },
          { name: "CLI", icon: <IconTerminal /> },
        ]}
      />
    </div>
  );
}
