"use client";

import { useState } from "react";

import { IconShare } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ShareDialog } from "@rhs-ui/primitives/share-dialog";

export default function Demo(): React.JSX.Element {
  const [access, setAccess] = useState<"off" | "view">("view");
  return (
    <div className="mx-auto flex min-h-64 max-w-sm items-center justify-center p-8">
      <ShareDialog
        title="Q2 roadmap"
        link="https://example.com/s/q2-roadmap-7k2m"
        linkAccess={access}
        onLinkAccessChange={setAccess}
        onInvite={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
        people={[
          { id: "1", name: "Anouk de Wit", email: "anouk@example.com", role: "owner" },
          { id: "2", name: "Luca Romano", email: "luca@example.com", role: "edit" },
          { id: "3", name: "Sara Haddad", email: "sara@example.com", role: "view" },
        ]}
      >
        <Button variant="outline"><IconShare /> Share</Button>
      </ShareDialog>
    </div>
  );
}
