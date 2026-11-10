"use client";

import { useRef, useState } from "react";

import { DangerZone } from "@rhs-ui/application/danger-zone";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("Nothing has been changed.");
  const deleteTries = useRef(0);

  return (
    <div className="grid w-full max-w-2xl min-w-0 gap-3">
      <DangerZone
        description="You cannot undo these yourself. Read what each one does before you press its button."
        actions={[
          {
            id: "archive",
            title: "Archive this workspace",
            description: "Hide Kestrel Studio from everyone's sidebar and stop the monthly billing. Projects and files are kept for 90 days, and an Admin can restore it from Settings.",
            label: "Archive workspace",
            dialogDescription: "Kestrel Studio disappears from the sidebar of all 12 members and billing stops today. Nothing is deleted for 90 days, and you can restore it from Settings until then.",
            onConfirm: async () => {
              await wait(800);
              setLog("Archived. It can be restored for 90 days.");
            },
          },
          {
            id: "transfer",
            title: "Transfer ownership",
            description: "Make another member the owner of Kestrel Studio. They take over billing and can delete the workspace.",
            label: "Transfer ownership",
            disabledReason: "Only the owner can do this",
            onConfirm: () => setLog("Ownership transferred."),
          },
          {
            id: "delete",
            title: "Delete this workspace",
            description: "Permanently remove Kestrel Studio, its 24 projects and every file in them, for all 12 members. There is no undo, and we cannot bring any of it back.",
            label: "Delete workspace",
            confirmLabel: "Delete forever",
            dialogDescription: "This removes Kestrel Studio, its 24 projects and every file in them for all 12 members, at once. There is no undo, and we cannot bring any of it back.",
            confirmation: "Kestrel Studio",
            onConfirm: async () => {
              await wait(1000);
              deleteTries.current += 1;
              if (deleteTries.current === 1) throw new Error("The server did not answer in time. Nothing was deleted.");
              setLog("Deleted Kestrel Studio. Not really: this is a preview.");
            },
          },
        ]}
      />
      <p role="status" className="text-xs text-muted-foreground">
        {log}
      </p>
      <p className="text-xs text-muted-foreground">Archive asks once. Delete asks for the name, and its first try fails so you can see the message: the second one goes through.</p>
    </div>
  );
}
