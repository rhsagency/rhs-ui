"use client";

import { useState } from "react";

import { TransferOwnershipCard, type TransferMember } from "@rhs-ui/application/transfer-ownership-card";
import { Button } from "@rhs-ui/primitives/button";

const MEMBERS: TransferMember[] = [
  { id: "u_mara", name: "Mara Jansen", email: "mara@kestrel.dev", role: "Admin" },
  { id: "u_theo", name: "Theo Okonkwo", email: "theo@kestrel.dev", role: "Admin" },
  { id: "u_ines", name: "Ines Carvalho", email: "ines@kestrel.dev", role: "Member" },
  { id: "u_daan", name: "Daan Verhoeven", email: "daan@kestrel.dev", role: "Member" },
  { id: "u_lena", name: "Lena Fischer", email: "lena@kestrel.dev", role: "Member", disabledReason: "Invite not accepted yet" },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  // A new key starts the card over, so the preview can be tried again.
  const [round, setRound] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-xs text-muted-foreground">In this preview, transferring to Daan Verhoeven fails: the choice stays and the message shows. Anyone else works.</p>
      <TransferOwnershipCard
        key={round}
        members={MEMBERS}
        workspaceName="Kestrel Studio"
        defaultMemberId="u_mara"
        consequences={[
          "You become an Admin of Kestrel Studio and keep access to everything.",
          "The new owner receives billing and can delete the workspace.",
          "Members, projects and settings stay exactly as they are.",
        ]}
        onTransfer={async (memberId) => {
          await wait(900);
          if (memberId === "u_daan") return "Daan Verhoeven has not verified their email yet. Ask them to confirm it from their inbox, then try again.";
        }}
        onCancel={() => setCancelled(true)}
      />
      <div className="mt-4 flex min-h-9 items-center justify-between gap-4">
        <p role="status" className="text-xs text-muted-foreground">
          {cancelled ? "Cancelled. Nothing was changed." : ""}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setRound((current) => current + 1);
            setCancelled(false);
          }}
        >
          Start over
        </Button>
      </div>
    </div>
  );
}
