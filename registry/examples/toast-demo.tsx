"use client";

import { Button } from "@rhs-ui/primitives/button";
import { Toaster, toast } from "@rhs-ui/primitives/toast";

export default function Demo(): React.JSX.Element {
  function save() {
    const id = toast("Saving your changes...", { duration: Infinity });
    window.setTimeout(() => {
      toast("Changes saved", {
        id,
        tone: "success",
        description: "Your homepage now shows the new hero.",
        action: { label: "Undo", altText: "Undo from the history panel", onClick: () => toast("Change undone", { tone: "info" }) },
      });
    }, 900);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button onClick={save}>Save changes</Button>
      <Button
        variant="outline"
        onClick={() => toast("Payment failed", { tone: "destructive", description: "The card was declined. Nothing was charged." })}
      >
        Show an error
      </Button>
      <Toaster />
    </div>
  );
}
