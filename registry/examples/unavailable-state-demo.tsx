"use client";

import type { ReactNode } from "react";

import { UnavailableState } from "@rhs-ui/application/unavailable-state";

/** Stands in for the request that sends a new link: the button shows a spinner until it settles, then the cooldown starts. */
const requestNew = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-rows-[auto_1fr] gap-3">
      <p className="min-h-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-5xl items-stretch gap-x-6 gap-y-9 md:grid-cols-2">
      <Case caption="Expired: ask for a new one. After a request the button waits out a cooldown (20 seconds here, 30 by default) and says how long is left.">
        <UnavailableState className="h-full justify-start" reason="expired" subject="invite" occurredAt="2026-10-28T09:30:00Z" timeZone="Europe/Amsterdam" locale="en-GB" onRequestNew={requestNew} homeHref="#home" cooldownSeconds={20} />
      </Case>

      <Case caption="Used: sign in is the main action, because it was probably you. Asking again sits beside it.">
        <UnavailableState className="h-full justify-start" reason="used" subject="reset link" occurredAt="2026-11-01T18:04:00Z" timeZone="Europe/Amsterdam" locale="en-GB" signInHref="#sign-in" onRequestNew={requestNew} homeHref="#home" />
      </Case>

      <Case caption="Withdrawn: nothing to request, so the way forward is a person. Children carry that line.">
        <UnavailableState className="h-full justify-start" reason="revoked" subject="share link" occurredAt="2026-10-30T12:00:00Z" timeZone="Europe/Amsterdam" locale="en-GB" homeHref="#home">
          <p className="max-w-xs text-xs leading-5 text-muted-foreground">Ask Mara Jansen at Kestrel Studio to share the folder again.</p>
        </UnavailableState>
      </Case>

      <Case caption="Removed: give up gracefully. A date without a time is written as a day.">
        <UnavailableState className="h-full justify-start" reason="removed" subject="page" occurredAt="2026-09-15" locale="en-GB" homeHref="#home" />
      </Case>
    </div>
  );
}
