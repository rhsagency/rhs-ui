"use client";

import { useId, useState, type ReactNode } from "react";

import { TermsUpdateGate } from "@rhs-ui/application/terms-update-gate";
import { IconCheck } from "@rhs-ui/icons";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const DOCUMENTS = [
  { label: "Terms of service", href: "#terms" },
  { label: "Privacy policy", href: "#privacy" },
  { label: "Data processing addendum", href: "#dpa" },
];

const EXCERPT = (
  <>
    <p>
      <strong>6.1 You own your content.</strong> Everything you upload to Northwind stays yours. We only use it to run the service for you and for the people you choose to share it with.
    </p>
    <p>
      <strong>6.2 Deleted projects.</strong> When you delete a project it moves to the trash for 30 days, and any workspace owner can restore it. After 30 days it is removed from our systems, and from our backups within a further 35 days.
    </p>
    <p>
      <strong>6.3 Exports.</strong> You can export your content at any time, in open formats, from Settings. Exports are prepared in the background and stay available for 7 days.
    </p>
    <p>
      <strong>6.4 Licence to run the service.</strong> You give Northwind the narrow permission it needs to store, back up and display your content to you and to the people you share it with. It ends when your content is removed.
    </p>
  </>
);

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

function Contact(): React.JSX.Element {
  return (
    <p className="text-xs leading-relaxed">
      Questions about the changes?{" "}
      <a href="#contact" className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Talk to our team
      </a>
      .
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");
  // Saving works the first time. The failure is something to try, not something that gets in the way.
  const [failing, setFailing] = useState(false);
  const failingId = useId();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Continue waits for the box and says why: press it early and the focus goes to the box">
          <TermsUpdateGate
            titleAs="h2"
            versionLabel="Terms v4.2"
            effectiveDate="2026-12-01"
            changes={[
              { text: "Deleted projects are kept for 30 days before they are removed for good, so a mistake can be undone.", href: "#section-6-2", linkLabel: "Section 6.2" },
              { text: "Billing contacts are set per workspace. Invoices go to the contact you choose, not to the owner.", href: "#section-9", linkLabel: "Section 9" },
              { text: "We moved our data processing to Frankfurt. Your data stays in the EU.", href: "#annex-2", linkLabel: "Annex 2" },
              { text: "Free workspaces are limited to 3 projects. Workspaces that already have more keep them." },
            ]}
            documents={DOCUMENTS}
            excerptTitle="Terms of service, section 6: Your content"
            excerpt={EXCERPT}
            footer={<Contact />}
            onAccept={async () => {
              await wait(900);
              if (failing) throw new Error("The consent service did not answer.");
            }}
            onAccepted={() => setNote("Accepted. In your app this is where you navigate on.")}
            onDecline={async () => {
              await wait(700);
              setNote("Declined. In your app this is where you sign the person out.");
            }}
          />
          <div className="flex items-center justify-center gap-2.5">
            <Checkbox id={failingId} checked={failing} onCheckedChange={(value) => setFailing(value === true)} />
            <Label htmlFor={failingId} className="text-xs font-normal text-muted-foreground">
              Simulate a failed save
            </Label>
          </div>
        </Step>

        <Step caption="Accepted: the choice is saved, said out loud, and the page moves on a moment later">
          <TermsUpdateGate
            titleAs="h2"
            defaultDone
            versionLabel="Privacy policy v3.0"
            effectiveDate="2026-12-01"
            timeZone="America/Los_Angeles"
            labels={{ heading: "We have updated our privacy policy" }}
            changes={[
              { text: "We list every sub-processor on one page and tell you 30 days before we add one.", href: "#sub-processors", linkLabel: "Sub-processors" },
              { text: "Support can now see your workspace only while a ticket is open and only with your permission." },
              { text: "Product analytics are off until you switch them on in Settings." },
            ]}
            documents={[{ label: "Privacy policy", href: "#privacy" }]}
            onAccept={() => undefined}
            onDecline={() => undefined}
          />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: tick the box and press Continue. Tick Simulate a failed save first to see the message and the tick that stays."
        )}
      </p>
    </div>
  );
}
