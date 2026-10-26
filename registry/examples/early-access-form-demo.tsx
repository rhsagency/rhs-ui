"use client";

import type { ReactNode } from "react";

import { EarlyAccessForm } from "@rhs-ui/marketing/early-access-form";

const roles = [
  { value: "product", label: "Product manager" },
  { value: "engineering", label: "Engineering lead" },
  { value: "design", label: "Designer" },
  { value: "founder", label: "Founder or executive" },
  { value: "operations", label: "Operations" },
  { value: "other", label: "Something else" },
];

const sizes = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "200+", label: "200+" },
];

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const apply = () => new Promise<void>((resolve) => setTimeout(resolve, 900));
/** Only one code works in this preview, so the failure and the success can both be tried. */
const checkCode = (code: string) => new Promise<boolean>((resolve) => setTimeout(() => resolve(code.toUpperCase() === "HAL-4821"), 600));

const copy = {
  description: "Halcyon Studio opens to teams in waves. Tell us a little about yours and we invite the people we can help most first.",
  reviewTime: "We review applications every Friday.",
  roles,
  sizes,
  onSubmit: apply,
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid gap-x-12 gap-y-16 lg:grid-cols-2">
        <Example caption="Try it: send it empty for the mistakes, then open the invite code (HAL-4821 works)">
          <EarlyAccessForm {...copy} title="Get early access" checkInviteCode={checkCode} />
        </Example>
        <div className="grid min-w-0 content-start gap-16">
          <Example caption="Applied: the confirmation says what happens next and when">
            <EarlyAccessForm {...copy} headingLevel={3} title="Get early access" defaultStatus="done" defaultValues={{ email: "maria@halcyon.studio" }} />
          </Example>
          <Example caption="With a valid invite code: no queue, and the confirmation says so">
            <EarlyAccessForm {...copy} headingLevel={3} title="Get early access" defaultStatus="invited" defaultValues={{ email: "maria@halcyon.studio", inviteCode: "HAL-4821" }} />
          </Example>
        </div>
      </div>
    </div>
  );
}
