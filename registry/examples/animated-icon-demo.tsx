"use client";

import { useEffect, useState } from "react";

import { IconBellAnimated } from "@rhs-ui/icons/animated/bell";
import { IconCopyAnimated } from "@rhs-ui/icons/animated/copy";
import { IconRefreshAnimated } from "@rhs-ui/icons/animated/refresh";
import { Button } from "@rhs-ui/primitives/button";

/** Three ways to drive an animated icon: hover on its button, a loop while busy, a state after an action. */
export default function Demo(): React.JSX.Element {
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!syncing) return;
    const timer = window.setTimeout(() => setSyncing(false), 2400);
    return () => window.clearTimeout(timer);
  }, [syncing]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="outline">
        <IconBellAnimated />
        Notifications
      </Button>
      <Button variant="outline" aria-busy={syncing || undefined} onClick={() => setSyncing(true)}>
        <IconRefreshAnimated trigger={syncing ? "loop" : "hover"} />
        {syncing ? "Syncing" : "Sync now"}
      </Button>
      <Button variant="outline" onClick={() => setCopied(true)}>
        <IconCopyAnimated active={copied} />
        {copied ? "Copied" : "Copy link"}
      </Button>
      <p className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </p>
    </div>
  );
}
