"use client";

import { useState } from "react";

import { IconSparkle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Coachmark } from "@rhs-ui/primitives/coachmark";

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(true);
  return (
    <div className="mx-auto flex min-h-80 max-w-md flex-col items-center gap-6 p-10">
      <Coachmark
        open={open}
        onFinish={() => setOpen(false)}
        steps={[
          { id: "1", title: "Summaries are here", body: "Get a Monday digest of what changed, written from the week's work." },
          { id: "2", title: "Choose who gets it", body: "Send it to the whole team or only to project leads." },
        ]}
      >
        <Button variant="outline"><IconSparkle /> Weekly summary</Button>
      </Coachmark>
      {!open ? <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Show the tip again</Button> : null}
    </div>
  );
}
