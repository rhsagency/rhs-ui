"use client";

import { useState } from "react";

import { EmailAddressesSection, type EmailAddress } from "@rhs-ui/application/email-addresses-section";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [emails, setEmails] = useState<EmailAddress[]>([
    { address: "ana.reyes@northwind.io", primary: true, verified: true },
    { address: "ana@halcyon.studio", primary: false, verified: true },
    { address: "areyes@kestrel.email", primary: false, verified: false },
  ]);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <EmailAddressesSection
        emails={emails}
        onAdd={async (address) => {
          await wait(700);
          if (address.toLowerCase() === "taken@northwind.io") throw new Error("That address belongs to another account.");
          setEmails((list) => [...list, { address, primary: false, verified: false }]);
        }}
        onMakePrimary={async (address) => {
          await wait(500);
          setEmails((list) => list.map((email) => ({ ...email, primary: email.address === address })));
        }}
        onRemove={async (address) => {
          await wait(600);
          setEmails((list) => list.filter((email) => email.address !== address));
        }}
        onResend={() => wait(800)}
      />
      <p className="mt-3 text-center text-xs text-muted-foreground">Try adding taken@northwind.io to see an address that is refused.</p>
    </div>
  );
}
