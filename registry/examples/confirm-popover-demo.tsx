"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ConfirmPopover } from "@rhs-ui/primitives/confirm-popover";

export default function Demo(): React.JSX.Element {
  const [deleted, setDeleted] = useState(false);
  return (
    <div className="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center gap-3 p-8">
      {deleted ? (
        <p role="status" className="text-sm text-muted-foreground">Invoice INV-2041 deleted. <button type="button" className="underline underline-offset-4" onClick={() => setDeleted(false)}>Undo</button></p>
      ) : (
        <ConfirmPopover title="Delete invoice INV-2041?" description="The customer keeps the copy they received. You cannot undo this." confirmLabel="Delete" onConfirm={() => new Promise<void>((resolve) => setTimeout(() => { setDeleted(true); resolve(); }, 600))}>
          <Button variant="outline">Delete invoice</Button>
        </ConfirmPopover>
      )}
    </div>
  );
}
