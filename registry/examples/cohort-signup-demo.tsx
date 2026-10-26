"use client";

import { useState } from "react";

import { CohortSignup, type Cohort, type CohortSignupProps } from "@rhs-ui/marketing/cohort-signup";

const winter: Cohort = {
  name: "Product design, winter cohort",
  startsAt: "2027-01-12T17:00:00Z",
  weeks: 8,
  schedule: "Live on Tuesdays at 18:00 CET",
  price: 1490,
  priceNote: "per participant, VAT included",
  seatsTotal: 30,
  seatsTaken: 16,
  // The end of 5 January in Amsterdam.
  deadline: "2027-01-05T22:59:00Z",
};

const spring: Cohort = {
  name: "Service design, spring cohort",
  startsAt: "2027-03-02T17:00:00Z",
  weeks: 6,
  schedule: "Live on Tuesdays and Thursdays at 18:00 CET",
  price: 990,
  priceNote: "per participant, VAT included",
  seatsTotal: 24,
  seatsTaken: 21,
  deadline: "2027-02-23T22:59:00Z",
};

const autumn: Cohort = {
  name: "Prototyping, autumn cohort",
  startsAt: "2026-11-03T18:00:00Z",
  weeks: 4,
  schedule: "Live on Tuesdays at 19:00 CET",
  price: 690,
  priceNote: "per participant, VAT included",
  seatsTotal: 20,
  seatsTaken: 20,
  deadline: "2026-10-27T22:59:00Z",
};

/** One intake with its own status line right under it, so whatever the reader presses is answered where they are looking. */
function Intake({ caption, programme, ...props }: Omit<CohortSignupProps, "action"> & { caption: string; programme: string }): React.JSX.Element {
  const [message, setMessage] = useState("");
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      <CohortSignup
        {...props}
        action={{
          onClick: (intent) => setMessage(intent === "reserve" ? `A seat in ${programme} is held for you. Demo only: nothing is charged.` : `You are on the waiting list for ${programme}. Demo only.`),
        }}
      />
      <p role="status" className="mt-5 min-h-6 text-center text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

const shared = { currency: "EUR", locale: "en-GB", timeZone: "Europe/Amsterdam", now: "2026-10-28T12:00:00Z", syllabusHref: "#syllabus" } as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Intake
        {...shared}
        caption="The next intake with seats left: the facts beside the enrolment panel, the price as the biggest number, a meter in words as well as the bar, and the deadline with its time zone"
        programme="Product design"
        cohort={winter}
        description="Take a product from a rough idea to a prototype you have tested with real people, with a small group and a working designer in the room."
      />

      <div className="mt-14 grid gap-x-10 gap-y-14 border-t border-border pt-12 lg:grid-cols-2">
        <Intake {...shared} caption="Nearly full: the count turns heavy and says Only, in words" programme="Service design" headingLevel={3} cohort={spring} />
        <Intake {...shared} caption="Full: the card says so in text, the button becomes the waiting list and the meter stays full" programme="Prototyping" headingLevel={3} cohort={autumn} now="2026-10-20T12:00:00Z" />
      </div>
    </div>
  );
}
