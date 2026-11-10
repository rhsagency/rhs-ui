"use client";

import { useRef, useState, type ReactNode } from "react";

import { ReportForm, type ReportReason, type ReportSubmission } from "@rhs-ui/application/report-form";
import { IconFlag } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const LISTING_REASONS: readonly ReportReason[] = [
  { id: "spam", label: "Spam or misleading", description: "Ads, scams and links that go nowhere." },
  { id: "prohibited", label: "Prohibited item", description: "Weapons, drugs, stolen goods or anything else we do not allow." },
  { id: "fraud", label: "Scam or fraud", description: "The seller asked you to pay or talk outside Kestrel.", requiresDetail: true },
  { id: "counterfeit", label: "Counterfeit or not as shown", description: "A fake of a known brand, or photos of another item." },
  { id: "other", label: "Something else", description: "Anything that does not fit above.", requiresDetail: true },
];

const USER_REASONS: readonly ReportReason[] = [
  { id: "harassment", label: "Harassment or hate", description: "Insults, threats or targeting a person or group.", requiresDetail: true },
  { id: "impersonation", label: "Pretending to be someone else", description: "A fake profile of a person, shop or brand." },
  { id: "spam", label: "Spam", description: "Repeated unwanted messages or promotions." },
  { id: "underage", label: "Under 16", description: "The person looks younger than Kestrel allows." },
  { id: "other", label: "Something else", description: "Anything that does not fit above.", requiresDetail: true },
];

const card = "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState<ReportSubmission | null>(null);
  const [open, setOpen] = useState(false);
  const tries = useRef(0);

  // A stand-in for the request that would send the report.
  async function send(report: ReportSubmission): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLast(report);
  }

  // The same, except that the first try fails, as a request does when the connection drops.
  async function sendOnSecondTry(report: ReportSubmission): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    tries.current += 1;
    if (tries.current === 1) throw new Error("offline");
    setLast(report);
  }

  return (
    <div className="grid w-full max-w-5xl gap-x-10 gap-y-9 lg:grid-cols-2 lg:items-start">
      <Example caption="Try it: Scam or fraud asks for detail, so a box opens and Send waits for ten characters. The first Send fails on purpose and the form stays; the second goes through.">
        <div className={card}>
          <ReportForm
            reasons={LISTING_REASONS}
            subject={{ kind: "listing", title: "Halcyon road bike, 54 cm", byline: "Posted by Mara Keller, 2 days ago" }}
            defaultValue={{ reasonId: "fraud", detail: "They asked me to continue on WhatsApp and pay a deposit by bank transfer." }}
            onSubmit={sendOnSecondTry}
            onCancel={() => undefined}
            onDone={() => undefined}
          />
        </div>
      </Example>

      <Example caption="With the block option, and nothing chosen yet: Send is disabled and the line beside it says why.">
        <div className={card}>
          <ReportForm
            reasons={USER_REASONS}
            subject={{ kind: "user", title: "Jonas Verhoeven", byline: "Member since March 2025" }}
            blockOption
            onSubmit={send}
            onCancel={() => undefined}
            onDone={() => undefined}
          />
        </div>
      </Example>

      <div className="min-w-0 lg:col-span-2">
        <Example caption="In a dialog, which is its main use: pass your DialogHeader as header. On a short screen the reasons scroll and Send stays in view, and after sending the dialog keeps its name.">
          <div className={`${card} flex flex-wrap items-center justify-between gap-x-6 gap-y-4`}>
            <div className="grid min-w-0 gap-1">
              <h2 className="text-base font-semibold tracking-[-0.02em]">Northwind espresso machine, 2022</h2>
              <p className="text-xs text-muted-foreground">Posted by Jonas Verhoeven, 5 hours ago</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <IconFlag aria-hidden="true" />
                  Report listing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <ReportForm
                  reasons={LISTING_REASONS}
                  subject={{ kind: "listing", title: "Northwind espresso machine, 2022", byline: "Posted by Jonas Verhoeven, 5 hours ago" }}
                  header={
                    <DialogHeader className="pr-8">
                      <DialogTitle className="text-lg tracking-[-0.02em]">Report this listing</DialogTitle>
                      <DialogDescription>What is wrong with it? Choose the closest reason.</DialogDescription>
                    </DialogHeader>
                  }
                  blockOption
                  onSubmit={send}
                  onCancel={() => setOpen(false)}
                  onDone={() => setOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </Example>
      </div>

      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground lg:col-span-2">
        <span>What onSubmit received last</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{last ? JSON.stringify({ ...last, detail: last.detail ? "…" : "" }).replace(/,/g, ", ") : "nothing yet"}</code>
      </p>
    </div>
  );
}
