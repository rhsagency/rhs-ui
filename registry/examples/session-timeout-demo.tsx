"use client";

import { useCallback, useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { SessionTimeout } from "@rhs-ui/primitives/session-timeout";

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState("Signed in");
  const signOut = useCallback(() => { setOpen(false); setState("Signed out"); }, []);
  return (
    <div className="mx-auto flex min-h-64 max-w-sm flex-col items-center justify-center gap-3 p-8 text-sm">
      <p className="text-muted-foreground">{state}</p>
      <Button variant="outline" onClick={() => { setState("Signed in"); setOpen(true); }}>Simulate an idle session</Button>
      <SessionTimeout open={open} seconds={90} onStay={() => { setOpen(false); setState("Session extended"); }} onSignOut={signOut} />
    </div>
  );
}
