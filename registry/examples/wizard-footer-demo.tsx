"use client";

import { useState, type ReactNode } from "react";

import { WizardFooter } from "@rhs-ui/application/wizard-footer";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { cn } from "@/lib/utils";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Halcyon Studio");
  const [invites, setInvites] = useState("");
  const [plan, setPlan] = useState("studio");
  const [done, setDone] = useState(false);

  const address = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const planName = PLANS.find((option) => option.value === plan)?.title ?? plan;

  return (
    <div className="w-full px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-3xl gap-12">
        <Case caption="Try it: Next saves for a second and the other buttons lock. Clear the name to see the reason in place of Next. Type northwind and Next fails with a message. Step 2 is optional, so it has Skip.">
          <Panel>
            {done ? (
              <div className="grid min-h-72 place-content-center justify-items-center gap-3 px-6 py-10 text-center">
                <h2 className="text-base font-semibold tracking-[-0.02em]">{name.trim()} is ready</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Your {planName} workspace lives at northwind.app/{address}.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDone(false);
                    setStep(1);
                  }}
                >
                  Start over
                </Button>
              </div>
            ) : (
              <>
                <div className="min-h-60 px-5 py-6 sm:px-6">
                  <h2 className="text-base font-semibold tracking-[-0.02em]">{STEPS[step - 1]}</h2>
                  <div className="mt-5 grid gap-5">
                    {step === 1 ? (
                      <div className="grid gap-2">
                        <Label htmlFor="wf-name">Workspace name</Label>
                        <Input id="wf-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="organization" />
                        <p className="text-xs text-muted-foreground">
                          Your address will be <span className="font-medium text-foreground">northwind.app/{address || "your-name"}</span>
                        </p>
                      </div>
                    ) : null}
                    {step === 2 ? (
                      <div className="grid gap-2">
                        <Label htmlFor="wf-invites">Email addresses</Label>
                        <Input id="wf-invites" type="email" placeholder="mara@halcyon.studio, tomas@halcyon.studio" value={invites} onChange={(event) => setInvites(event.target.value)} />
                        <p className="text-xs text-muted-foreground">Optional. Teammates get an email and can start straight away.</p>
                      </div>
                    ) : null}
                    {step === 3 ? <RadioCards label="Plan" options={PLANS} value={plan} onValueChange={setPlan} /> : null}
                    {step === 4 ? (
                      <dl className="grid gap-3 text-sm">
                        <Row term="Workspace" detail={`${name.trim()} (northwind.app/${address})`} />
                        <Row term="Team" detail={invites.trim() ? invites.trim() : "Just you for now"} />
                        <Row term="Plan" detail={planName} />
                      </dl>
                    ) : null}
                  </div>
                </div>
                <WizardFooter
                  step={step}
                  stepCount={STEPS.length}
                  canContinue={step !== 1 || name.trim().length >= 3}
                  canContinueReason="Enter a name of at least 3 characters to continue."
                  continueLabel={step === STEPS.length ? "Create workspace" : undefined}
                  savingLabel={step === STEPS.length ? "Creating" : "Saving"}
                  onBack={() => setStep(step - 1)}
                  onSkip={step === 2 ? () => setStep(3) : undefined}
                  onContinue={async () => {
                    await wait(900);
                    if (step === 1 && address === "northwind") throw new Error("That address is already taken. Try another name.");
                    if (step === STEPS.length) setDone(true);
                    else setStep(step + 1);
                  }}
                />
              </>
            )}
          </Panel>
        </Case>

        <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
          <Case caption="In a narrow bar, a sheet or a phone, the buttons stack and Continue is on top. The first step has no Back, and while Continue cannot be pressed the footer says why.">
            <Panel>
              <WizardFooter step={1} stepCount={5} canContinue={false} canContinueReason="Choose a plan to continue." onContinue={() => undefined} />
            </Panel>
          </Case>
          <Case caption="The last step says Finish by itself. Back and Skip stay in reach, below the one action that matters.">
            <Panel>
              <WizardFooter step={5} stepCount={5} onBack={() => undefined} onSkip={() => undefined} onContinue={() => undefined} />
            </Panel>
          </Case>
        </div>

        <Case caption="sticky: the bar stays at the bottom of the area that scrolls, a sheet or a dialog, while the content moves under it. At this width the step context sits above a row of buttons.">
          <Panel className="max-w-lg">
            <div className="relative h-72 overflow-auto">
              <div className="grid gap-4 px-5 pt-6 pb-8 sm:px-6">
                <h2 className="text-base font-semibold tracking-[-0.02em]">Review the data processing terms</h2>
                {TERMS.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-6 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
              <WizardFooter sticky step={3} stepCount={4} onBack={() => undefined} continueLabel="Accept and continue" onContinue={() => undefined} />
            </div>
          </Panel>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The sheet or dialog a footer sits in, so it is seen in its place. */
function Panel({ children, className }: { children: ReactNode; className?: string }): React.JSX.Element {
  return <div className={cn("overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)}>{children}</div>;
}

function Row({ term, detail }: { term: string; detail: string }): React.JSX.Element {
  return (
    <div className="grid gap-0.5 border-b border-border pb-3 last:border-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0 font-medium [overflow-wrap:anywhere]">{detail}</dd>
    </div>
  );
}

const STEPS = ["Name your workspace", "Invite your team", "Choose a plan", "Review"] as const;

const PLANS = [
  { value: "starter", title: "Starter", description: "Up to 3 people and 5 projects.", aside: "Free" },
  { value: "studio", title: "Studio", description: "Unlimited projects and guests, 90 days of history.", aside: "€18 / month" },
  { value: "scale", title: "Scale", description: "Single sign-on, audit log and a named contact.", aside: "€64 / month" },
];

const TERMS = [
  "Northwind acts as a processor of the personal data that you and your team put into the workspace. We only process it to provide the service and to follow your written instructions.",
  "We keep your data in data centres in the European Union. Your files and messages are encrypted in transit and at rest, and access for our own staff is logged and limited to what a support request needs.",
  "When you invite a colleague or a client, they can see the projects you share with them, and nothing else. You can remove anyone at any time and their access ends at once.",
  "If we use another company to run part of the service, we tell you before we do and we have a contract with them that holds them to the same terms. The current list is on our trust page.",
  "When you delete the workspace, we remove its data from our systems within 30 days and from our backups within 90 days. Before that you can export everything as a single archive.",
];
