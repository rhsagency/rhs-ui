"use client";

import { useRef, useState } from "react";

import { EarlyAccessFeatures, type EarlyAccessFeature } from "@rhs-ui/application/early-access-features";

const INITIAL: EarlyAccessFeature[] = [
  {
    id: "command-bar",
    name: "Command bar",
    description: "Jump to any project, person or setting with Cmd K, and run actions without leaving the keyboard.",
    stage: "beta",
    enabled: true,
    feedbackHref: "#feedback-command-bar",
    docsHref: "#docs-command-bar",
  },
  {
    id: "meeting-notes",
    name: "Meeting notes",
    description: "Turns a recording into notes and action items a few minutes after the call ends.",
    stage: "alpha",
    enabled: false,
    effect: "Recordings you upload are summarised automatically, and the notes land in the project.",
    undo: "Switch it off to stop; notes already made stay where they are.",
    feedbackHref: "#feedback-meeting-notes",
    docsHref: "#docs-meeting-notes",
  },
  {
    id: "offline-mode",
    name: "Offline mode",
    description: "Keep editing on the train and sync everything once you are back online.",
    stage: "alpha",
    enabled: false,
    effect: "Your last 30 days of projects are kept on this device.",
    feedbackHref: "#feedback-offline-mode",
    docsHref: "#docs-offline-mode",
  },
  {
    id: "audit-trail",
    name: "Audit trail",
    description: "See who changed what and when, with filters and a CSV export.",
    stage: "beta",
    enabled: false,
    disabledReason: "Needs the Team plan",
    docsHref: "#docs-audit-trail",
  },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [features, setFeatures] = useState(INITIAL);
  // Offline mode fails the first time it is switched on, so the rollback can be seen.
  const failedOnce = useRef(false);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-xs text-muted-foreground">Offline mode fails the first time you switch it on, to show the rollback. The second try works.</p>
      <EarlyAccessFeatures
        features={features}
        onToggle={async (id, enabled) => {
          await wait(500);
          if (id === "offline-mode" && enabled && !failedOnce.current) {
            failedOnce.current = true;
            throw new Error("The device storage check failed.");
          }
          setFeatures((current) => current.map((feature) => (feature.id === id ? { ...feature, enabled } : feature)));
        }}
      />
    </div>
  );
}
