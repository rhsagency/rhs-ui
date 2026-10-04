"use client";

import { TermTooltip } from "@rhs-ui/primitives/term-tooltip";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg p-10 text-base leading-relaxed">
      <p>
        Every plan includes <TermTooltip definition="Single sign-on: people sign in with the account your company already manages, like Microsoft or Google." href="#sso">SSO</TermTooltip> and a 99.9% <TermTooltip term="Service level agreement" definition="Our promise in writing about uptime. If we miss it, you get credit back on your next invoice." href="#sla">SLA</TermTooltip>, billed per active seat.
      </p>
    </div>
  );
}
