import type { ReactNode } from "react";

import { CallUsSection, type CallHoursRange } from "@rhs-ui/marketing/call-us-section";

const hours: CallHoursRange[] = [
  { days: ["mon", "tue", "wed", "thu", "fri"], opens: "08:00", closes: "17:30" },
  { days: ["sat"], opens: "09:00", closes: "13:00" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const shared = { timeZone: "Europe/Amsterdam", locale: "en-GB", hours } as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Tuesday morning in Amsterdam: the line is open, the number is the biggest thing here, and the week is one press away">
        <CallUsSection
          {...shared}
          now="2026-10-27T09:12:00Z"
          title="Burst pipe? Ring us now"
          description="A real plumber answers, not a call centre. Tell us where you are and we are on the way."
          phone="+31 20 123 45 67"
          afterHours={{ label: "Emergency line, every night", phone: "+31 6 1234 5678" }}
          alternative={{ prompt: "Prefer we call you?", label: "Request a callback", href: "#callback" }}
          defaultOpen
        />
      </Example>

      <div className="mt-16 grid gap-x-10 gap-y-14 border-t border-border pt-12 lg:grid-cols-2">
        <Example caption="Tuesday evening: the line is closed, and the emergency number stands out">
          <CallUsSection
            {...shared}
            headingLevel={3}
            now="2026-10-27T19:40:00Z"
            title="Burst pipe? Ring us now"
            phone="+31 20 123 45 67"
            afterHours={{ label: "Emergency line, every night", phone: "+31 6 1234 5678" }}
            alternative={{ prompt: "Prefer we call you?", label: "Request a callback", href: "#callback" }}
          />
        </Example>
        <Example caption="Saturday afternoon, no night line: it says when the phone is answered next, by name of the day">
          <CallUsSection
            {...shared}
            headingLevel={3}
            now="2026-10-31T13:30:00Z"
            title="Questions about your quote?"
            phone="+31 20 123 45 67"
            alternative={{ prompt: "Prefer we call you?", label: "Request a callback", href: "#callback" }}
          />
        </Example>
      </div>
    </div>
  );
}
