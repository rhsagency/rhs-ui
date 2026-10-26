"use client";

import { useState } from "react";

import { WizardShell } from "@rhs-ui/application/wizard-shell";
import { IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { ResultState } from "@rhs-ui/primitives/result-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const STEPS = [
  { title: "Your company", description: "Tell us who is shipping with Kestrel." },
  { title: "Pick a depot", description: "Parcels are collected from the depot closest to your warehouse." },
  { title: "Invite your team", description: "Optional. They get an email and can start right away." },
  { title: "Choose a plan", description: "Change it any time; billing follows the day you switch." },
  { title: "Review", description: "One last look before we create the account." },
] as const;

const DEPOTS = [
  { value: "rotterdam", title: "Rotterdam Waalhaven", description: "Pickup until 18:00, Monday to Saturday.", aside: "Nearest" },
  { value: "antwerp", title: "Antwerp Deurne", description: "Pickup until 17:00, Monday to Friday." },
  { value: "hamburg", title: "Hamburg Billbrook", description: "Pickup until 18:30, Monday to Saturday." },
];
const PLANS = [
  { value: "starter", title: "Starter", description: "Up to 200 parcels a month.", aside: "€49 / month" },
  { value: "growth", title: "Growth", description: "Up to 2,000 parcels, returns portal included.", aside: "€179 / month" },
  { value: "scale", title: "Scale", description: "Unlimited parcels and a named contact.", aside: "€640 / month" },
];
const INDUSTRIES = ["Retail", "Food and beverage", "Manufacturing", "Healthcare"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Demo(): React.JSX.Element {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"form" | "saved" | "done">("form");
  const [company, setCompany] = useState("Halcyon Studio B.V.");
  const [industry, setIndustry] = useState("Retail");
  const [depot, setDepot] = useState("rotterdam");
  const [invites, setInvites] = useState(["", ""]);
  const [plan, setPlan] = useState("growth");

  const typed = invites.filter((address) => address.trim());
  const invalid = typed.some((address) => !EMAIL.test(address.trim()));
  const depotName = DEPOTS.find((item) => item.value === depot)?.title ?? depot;
  const planName = PLANS.find((item) => item.value === plan)?.title ?? plan;

  if (phase !== "form") {
    return (
      <div className="grid min-h-[calc(100dvh-3rem)] place-items-center px-4">
        {phase === "done" ? (
          <ResultState
            tone="success"
            title={`${company.trim()} is ready to ship`}
            description={`Your ${planName} account is live. Parcels are collected from ${depotName}${typed.length ? ` and ${typed.length} teammate${typed.length === 1 ? " has" : "s have"} been invited` : ""}.`}
            actions={
              <Button
                variant="outline"
                onClick={() => {
                  setPhase("form");
                  setStep(0);
                  setCompany("Halcyon Studio B.V.");
                  setInvites(["", ""]);
                }}
              >
                Start over
              </Button>
            }
          />
        ) : (
          <ResultState
            tone="success"
            title="Your progress is saved"
            description="We sent a link to your email. Open it on any device to pick up at the step you left."
            actions={
              <Button onClick={() => setPhase("form")}>
                Continue where I left off
                <IconArrowRight />
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const gate =
    step === 0 && company.trim().length < 2
      ? { ok: false, reason: "Add your company name to continue." }
      : step === 2 && invalid
        ? { ok: false, reason: "One of the email addresses is not valid." }
        : { ok: true, reason: undefined };

  return (
    <WizardShell
      mainId="wizard-main"
      titleAs="h2"
      className="min-h-[calc(100dvh-3rem)]"
      brand={
        <span className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-lg bg-foreground text-background">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="currentColor">
              <path d="M2 13 8 3l6 10h-4L8 9.5 6 13z" />
            </svg>
          </span>
          Kestrel Freight
        </span>
      }
      help={
        <Button variant="ghost" size="sm" className="max-sm:hidden">
          Need help?
        </Button>
      }
      onExit={() => setPhase("saved")}
      steps={STEPS}
      current={step}
      onStepChange={setStep}
      canContinue={gate.ok}
      canContinueReason={gate.reason}
      onSkip={step === 2 ? () => setStep(3) : undefined}
      continueLabel={step === STEPS.length - 1 ? "Create account" : undefined}
      onContinue={async () => {
        if (step < STEPS.length - 1) {
          setStep(step + 1);
          return;
        }
        await wait(1100);
        setPhase("done");
      }}
    >
      {step === 0 ? (
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="wizard-company">Company name</Label>
            <Input id="wizard-company" autoComplete="organization" placeholder="Your registered company name" value={company} onChange={(event) => setCompany(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wizard-industry">Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger id="wizard-industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wizard-vat">
              VAT number <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="wizard-vat" placeholder="NL123456789B01" />
          </div>
        </div>
      ) : null}
      {step === 1 ? <RadioCards label="Depot" options={DEPOTS} value={depot} onValueChange={setDepot} /> : null}
      {step === 2 ? (
        <div className="grid gap-5">
          {invites.map((address, index) => (
            <div key={index} className="grid gap-2">
              <Label htmlFor={`wizard-invite-${index}`}>Teammate {index + 1}</Label>
              <Input
                id={`wizard-invite-${index}`}
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="name@company.com"
                value={address}
                aria-invalid={address.trim() !== "" && !EMAIL.test(address.trim()) ? true : undefined}
                onChange={(event) => setInvites((list) => list.map((entry, at) => (at === index ? event.target.value : entry)))}
              />
            </div>
          ))}
        </div>
      ) : null}
      {step === 3 ? <RadioCards label="Plan" options={PLANS} value={plan} onValueChange={setPlan} /> : null}
      {step === 4 ? (
        <div className="grid gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <DescriptionList
              items={[
                { term: "Company", value: company.trim() },
                { term: "Industry", value: industry },
                { term: "Depot", value: depotName },
                { term: "Teammates", value: typed.length ? typed.join(", ") : "None yet" },
                { term: "Plan", value: `${planName}, ${PLANS.find((item) => item.value === plan)?.aside ?? ""}` },
              ]}
            />
          </div>
          <p className="text-sm text-muted-foreground">You can change any of this later in settings. Nothing is charged until your first parcel is collected.</p>
        </div>
      ) : null}
    </WizardShell>
  );
}
