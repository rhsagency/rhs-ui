"use client";

import { useState } from "react";

import { IconCreditCard, IconHelp, IconKeyboard, IconSettings, IconUser } from "@rhs-ui/icons";
import { UserMenu } from "@rhs-ui/primitives/user-menu";

export default function Demo(): React.JSX.Element {
  const [signedOut, setSignedOut] = useState(false);
  return (
    <div className="mx-auto flex min-h-80 max-w-md items-start justify-end gap-3 p-8">
      {signedOut ? <p className="text-sm text-muted-foreground">Signed out. <button type="button" className="underline underline-offset-4" onClick={() => setSignedOut(false)}>Sign in again</button></p> : null}
      <UserMenu
        name="Anouk de Wit"
        email="anouk@example.com"
        onSignOut={() => setSignedOut(true)}
        groups={[
          [{ label: "Profile", icon: <IconUser />, href: "#profile" }, { label: "Settings", icon: <IconSettings />, href: "#settings", shortcut: "⌘," }, { label: "Billing", icon: <IconCreditCard />, href: "#billing" }],
          [{ label: "Keyboard shortcuts", icon: <IconKeyboard />, onSelect: () => undefined, shortcut: "?" }, { label: "Help centre", icon: <IconHelp />, href: "#help" }],
        ]}
      />
    </div>
  );
}
