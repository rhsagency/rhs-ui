"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { IconChartBar, IconDownload, IconKey } from "@rhs-ui/icons";
import { UpgradePrompt, type UpgradePromptProps } from "@rhs-ui/marketing/upgrade-prompt";
import { Button } from "@rhs-ui/primitives/button";

/** What the free plan shows once the reader has said not now: the page still works, and the offer is one press away. */
function FreeView({ icon, note, headingRef, onShow }: { icon: ReactNode; note: string; headingRef: RefObject<HTMLHeadingElement | null>; onShow: () => void }): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-muted">
        {icon}
      </span>
      {/* Focus lands here after Not now, so a keyboard reader hears where they are instead of losing their place. */}
      <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-base font-medium outline-none">
        You are on the free view
      </h2>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">{note}</p>
      <Button variant="outline" size="sm" onClick={onShow} className="mt-5">
        Show the upgrade offer again
      </Button>
    </div>
  );
}

type PromptProps = Omit<UpgradePromptProps, "onUpgrade" | "onDismiss" | "ref" | "tabIndex">;

/**
 * One prompt with everything it does kept to itself: its own free view to fall back to, and its own status line
 * right under it, so whatever the reader presses is answered where they are looking.
 */
function Example({ caption, prompt, icon, note, className }: { caption: string; prompt: PromptProps; icon: ReactNode; note: string; className?: string }): React.JSX.Element {
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState("");
  // Focus only moves for something the reader did, never on the first render.
  const acted = useRef(false);
  const regionRef = useRef<HTMLElement>(null);
  const freeRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (acted.current) (dismissed ? freeRef.current : regionRef.current)?.focus();
  }, [dismissed]);

  function change(next: boolean) {
    acted.current = true;
    setMessage("");
    setDismissed(next);
  }

  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <p className="mb-6 text-xs text-muted-foreground lg:min-h-8">{caption}</p>
      {dismissed ? (
        <FreeView icon={icon} note={note} headingRef={freeRef} onShow={() => change(false)} />
      ) : (
        <UpgradePrompt
          {...prompt}
          ref={regionRef}
          tabIndex={-1}
          className="outline-none"
          onUpgrade={() => setMessage(`Upgrade to ${prompt.plan.name} started. Demo only: nothing is charged.`)}
          onDismiss={() => change(true)}
        />
      )}
      <p role="status" className="mt-4 min-h-6 text-center text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid gap-x-12 gap-y-14 lg:grid-cols-2">
        <Example
          caption="In place of locked content, with the free allowance as a meter. Try Not now: it returns to the free view, and nothing was ever trapped."
          icon={<IconChartBar size={18} />}
          note="Your own reports are all here. Team analytics stays off until you want it."
          prompt={{
            feature: "Team analytics",
            description: "See how every project is doing in one place: who ships, what stalls and where the week went.",
            plan: { name: "Team", price: 29, period: "per user, per month" },
            unlocks: ["Dashboards for every project and every person", "Reports that send themselves every Monday", "Twelve months of history, not thirty days", "Export to CSV and a live link for your board"],
            usage: { used: 8, limit: 10, label: "Reports this month" },
            compareHref: "#plans",
          }}
        />

        <Example
          caption="The allowance is gone: the meter says so in words as well as the bar. Not now works here too."
          icon={<IconDownload size={18} />}
          note="You can still export by hand, any time. Scheduled exports stays off until you want it."
          prompt={{
            feature: "Scheduled exports",
            description: "Send a finished report to your inbox or a shared folder on the day and at the hour you choose.",
            plan: { name: "Team", price: 29, period: "per user, per month" },
            unlocks: ["Exports every day, week or month", "A folder in Drive, Dropbox or S3", "Up to 50 recipients per schedule"],
            usage: { used: 10, limit: 10, label: "Exports this month" },
            compareHref: "#plans",
          }}
        />

        {/* The third sits centred under the pair, as wide as one of them. */}
        <Example
          className="lg:col-span-2 lg:w-[calc(50%-1.5rem)] lg:justify-self-center"
          caption="Locked outright, in euros and without a comparison link: the same panel shrinks to what it needs."
          icon={<IconKey size={18} />}
          note="Everyone still signs in with email and a password. Single sign-on stays off until you want it."
          prompt={{
            feature: "Single sign-on",
            plan: { name: "Business", price: 49.5, period: "per user, per month" },
            unlocks: ["SAML with Okta, Entra ID and Google", "Automatic offboarding with SCIM"],
            currency: "EUR",
            locale: "en-IE",
          }}
        />
      </div>
    </div>
  );
}
