"use client";

import { useState, type ReactNode } from "react";

import { ExpirySelect } from "@rhs-ui/primitives/expiry-select";
import { Label } from "@rhs-ui/primitives/label";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs";

function Reported({ value }: { value: unknown }): React.JSX.Element {
  return (
    <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
      <span>Reported</span>
      <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(value)}</code>
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [key, setKey] = useState<string | null | undefined>("2026-12-02");
  const [invite, setInvite] = useState<string | null | undefined>("2026-10-15");
  const [trial, setTrial] = useState<string | null | undefined>(undefined);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: pick a length, Custom date or Never. The lengths count from 2 November 2026, so the dates in this preview stay put.">
          <div className={card}>
            <div className="grid gap-1">
              <h2 className="text-sm font-medium tracking-[-0.01em]">New API key</h2>
              <p className="text-xs text-muted-foreground">Keys used by the Kestrel CI pipeline. Rotate them before they end.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="key-expiry">Expiration</Label>
              <ExpirySelect id="key-expiry" name="expires" locale="en-GB" from="2026-11-02" allowNever value={key} onValueChange={setKey} />
            </div>
            <Reported value={key ?? null} />
          </div>
        </Example>
        <Example caption="Starting from now, no choice yet: the line under the field stays empty until there is something to say">
          <div className={card}>
            <div className="grid gap-2">
              <Label htmlFor="trial-expiry">Trial length</Label>
              <ExpirySelect
                id="trial-expiry"
                locale="en-GB"
                presets={[
                  { label: "14 days", days: 14 },
                  { label: "30 days", days: 30 },
                ]}
                value={trial}
                onValueChange={setTrial}
              />
            </div>
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A limit: invitations end within 30 days, so the longer lengths are off and say why. The picker stops there too.">
          <div className={card}>
            <div className="grid gap-2">
              <Label htmlFor="invite-expiry">Invitation link</Label>
              <ExpirySelect
                id="invite-expiry"
                locale="en-GB"
                from="2026-11-02"
                max="2026-12-02"
                presets={[
                  { label: "1 day", days: 1 },
                  { label: "7 days", days: 7 },
                  { label: "30 days", days: 30 },
                  { label: "90 days", days: 90 },
                ]}
                defaultValue="2026-11-09"
              />
            </div>
          </div>
        </Example>
        <Example caption="A date that has passed is refused with a message, and choosing another one clears it">
          <div className={card}>
            <div className="grid gap-2">
              <Label htmlFor="old-expiry">Guest invitation</Label>
              <ExpirySelect id="old-expiry" locale="en-GB" from="2026-11-02" value={invite} onValueChange={setInvite} />
            </div>
          </div>
        </Example>
        <Example caption="Disabled">
          <ExpirySelect disabled aria-label="Coupon expiry" locale="en-GB" from="2026-11-02" allowNever defaultValue={null} />
        </Example>
      </div>
    </div>
  );
}
