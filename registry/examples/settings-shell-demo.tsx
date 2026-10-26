"use client";

import { useState } from "react";

import { ConnectedAccounts, type ConnectedAccount } from "@rhs-ui/application/connected-accounts";
import { EmailAddressesSection, type EmailAddress } from "@rhs-ui/application/email-addresses-section";
import { PrivacySettingsSection, type PrivacySettings } from "@rhs-ui/application/privacy-settings-section";
import { SettingsShell } from "@rhs-ui/application/settings-shell";
import { IconBell, IconBuilding, IconCreditCard, IconFileText, IconKey, IconPlug, IconShield, IconUser, IconUsers, IconWorkflow } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [emails, setEmails] = useState<EmailAddress[]>([
    { address: "mara.okafor@halcyon.studio", primary: true, verified: true },
    { address: "mara@okafor.design", primary: false, verified: true },
  ]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    { id: "google", name: "Google", identity: "mara.okafor@gmail.com", connectedAt: "2026-03-14T09:12:00Z" },
    { id: "microsoft", name: "Microsoft" },
    { id: "apple", name: "Apple" },
  ]);
  const [privacy, setPrivacy] = useState<PrivacySettings>({ visibility: "members", showActivity: true, searchEngines: false, shareUsage: true });

  return (
    <SettingsShell
      className="min-h-[calc(100dvh-3rem)]"
      backHref="#app"
      currentHref="/settings/account"
      title="Account"
      titleAs="h2"
      description="Where your sign-in mail goes, how you get in, and what other people can see."
      actions={<Button variant="outline">View public profile</Button>}
      groups={[
        {
          label: "Account",
          links: [
            { href: "/settings/profile", label: "Profile", icon: <IconUser /> },
            { href: "/settings/account", label: "Account", icon: <IconShield /> },
            { href: "/settings/notifications", label: "Notifications", icon: <IconBell /> },
          ],
        },
        {
          label: "Workspace",
          links: [
            { href: "/settings/workspace", label: "General", icon: <IconBuilding /> },
            { href: "/settings/members", label: "Members", icon: <IconUsers />, badge: "12" },
            { href: "/settings/billing", label: "Billing", icon: <IconCreditCard /> },
            { href: "/settings/integrations", label: "Integrations", icon: <IconPlug /> },
          ],
        },
        {
          label: "Developers",
          links: [
            { href: "/settings/api-keys", label: "API keys", icon: <IconKey /> },
            { href: "/settings/webhooks", label: "Webhooks", icon: <IconWorkflow /> },
            { href: "/settings/audit-log", label: "Audit log", icon: <IconFileText /> },
          ],
        },
      ]}
    >
      <EmailAddressesSection
        headingLevel={3}
        emails={emails}
        onAdd={async (address) => {
          await wait(600);
          setEmails((list) => [...list, { address, primary: false, verified: false }]);
        }}
        onMakePrimary={async (address) => {
          await wait(400);
          setEmails((list) => list.map((email) => ({ ...email, primary: email.address === address })));
        }}
        onRemove={async (address) => {
          await wait(400);
          setEmails((list) => list.filter((email) => email.address !== address));
        }}
        onResend={() => wait(600)}
      />
      <ConnectedAccounts
        headingLevel={3}
        accounts={accounts}
        timeZone="Europe/Amsterdam"
        onConnect={async (id) => {
          await wait(600);
          setAccounts((list) => list.map((item) => (item.id === id ? { ...item, identity: "mara.okafor@halcyon.studio", connectedAt: "2026-10-26T09:00:00Z" } : item)));
        }}
        onDisconnect={async (id) => {
          await wait(500);
          setAccounts((list) => list.map((item) => (item.id === id ? { id: item.id, name: item.name } : item)));
        }}
      />
      <PrivacySettingsSection
        headingLevel={3}
        value={privacy}
        policyHref="#privacy"
        onChange={async (next) => {
          setPrivacy(next);
          await wait(350);
        }}
      />
    </SettingsShell>
  );
}
