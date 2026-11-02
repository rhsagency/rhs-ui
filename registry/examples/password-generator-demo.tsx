"use client";

import { useState, type ReactNode } from "react";

import { PasswordGenerator } from "@rhs-ui/primitives/password-generator";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Account(): React.JSX.Element {
  const [used, setUsed] = useState<number | null>(null);
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Temporary password for Maya Okafor</h2>
        <p className="text-xs text-muted-foreground">She will be asked to change it the first time she signs in to Northwind.</p>
      </div>
      <PasswordGenerator label="Temporary password for Maya Okafor" onUse={(password) => setUsed(password.length)} />
      <p role="status" className="min-h-4 border-t border-border pt-4 text-xs text-muted-foreground">
        {used === null ? "Nothing is sent or stored until you press Use this password." : `Set. A ${used}-character password is waiting for Maya.`}
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: move the slider, switch a set off, press Regenerate">
        <Account />
      </Example>
      <Example caption="A passphrase of random words, easier to type and to remember">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <PasswordGenerator defaultMode="passphrase" defaultLength={5} />
        </div>
      </Example>
    </div>
  );
}
