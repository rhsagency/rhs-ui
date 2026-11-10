"use client";

import type { ReactNode } from "react";

import { ReviewForm, type ReviewValues } from "@rhs-ui/marketing/review-form";

/** What a customer already wrote, so the states below show a form that was really filled in. */
const FILLED: Partial<Omit<ReviewValues, "photo">> = {
  rating: 5,
  headline: "Worth every euro",
  story: "I was sceptical about coffee on subscription. Three months in I have not bought a bag at the supermarket once, and the Ethiopian roast is the best thing I drink all week.",
  name: "Anna",
  role: "Product manager, Northwind",
  email: "anna@example.com",
  consent: true,
};

const DESCRIPTION = "A few honest lines help the next person decide. We publish only what you allow.";

function Cell({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-5 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-16 px-6 py-10 lg:grid-cols-2">
      <Cell caption="Idle. Live: fill it in and send it">
        <ReviewForm
          title="Tell us how it went"
          description={DESCRIPTION}
          fields={{ photo: true }}
          onSubmit={async () => {
            await new Promise((resolve) => setTimeout(resolve, 1400));
          }}
          className="py-0 sm:py-0"
        />
      </Cell>
      <Cell caption="Sending. The fields lock, the button spins">
        <ReviewForm title="How was your first box?" description={DESCRIPTION} status="busy" defaultValues={FILLED} onSubmit={() => {}} className="py-0 sm:py-0" />
      </Cell>
      <Cell caption="Failed. Every value is kept for another try">
        <ReviewForm title="Share your experience" description={DESCRIPTION} status="error" defaultValues={FILLED} onSubmit={() => {}} className="py-0 sm:py-0" />
      </Cell>
      <Cell caption="Sent. The confirmation replaces the form">
        <ReviewForm
          title="Leave a review"
          description={DESCRIPTION}
          status="done"
          defaultValues={FILLED}
          onSubmit={() => {}}
          after={
            <a href="#" className="text-sm font-medium underline underline-offset-4 outline-none hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
              Back to the shop
            </a>
          }
          className="py-0 sm:py-0"
        />
      </Cell>
    </div>
  );
}
