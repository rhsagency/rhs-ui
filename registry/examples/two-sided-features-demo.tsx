import type { ReactNode } from "react";

import {
  IconCalendarCheck,
  IconCamera,
  IconEuro,
  IconEyeOff,
  IconHeadphones,
  IconMessage,
  IconReceipt,
  IconShield,
  IconShieldCheck,
  IconTrendUp,
  IconUserCheck,
  IconWallet,
} from "@rhs-ui/icons";
import { TwoSidedFeatures } from "@rhs-ui/marketing/two-sided-features";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="A booking platform explained to both sides: four benefits each, on the same rows across the centre rule, and one button each of the same weight">
        <TwoSidedFeatures
          eyebrow="How Kestrel works"
          title="A stay only works when it works for both sides"
          description="Kestrel is built on one rule: nothing ships that helps hosts at the expense of guests, or the other way round."
          sides={[
            {
              label: "For hosts",
              heading: "Fill your calendar without chasing anyone",
              benefits: [
                { icon: <IconShieldCheck />, title: "Guests are verified before they book", description: "ID, payment method and past stays are checked up front, so every request you see is one you can accept." },
                { icon: <IconTrendUp />, title: "A nightly price that follows demand", description: "Kestrel suggests a rate from your local calendar and nearby stays. You always have the last word." },
                { icon: <IconWallet />, title: "Paid the day after check-in", description: "Your payout arrives within 24 hours of the guest's arrival, in your own currency." },
                { icon: <IconShield />, title: "Damage cover up to €1,000,000", description: "Included in every booking, with a named claims handler who calls you back." },
              ],
              cta: { label: "List your place", href: "#host" },
            },
            {
              label: "For guests",
              heading: "Find a place that is what the photos say",
              benefits: [
                { icon: <IconCamera />, title: "Photos a person has checked", description: "Our team compares every listing with a visit or a live walk-through before it goes live." },
                { icon: <IconReceipt />, title: "The full price, up front", description: "Cleaning and service fees are in the number you see first. Nothing is added at checkout." },
                { icon: <IconCalendarCheck />, title: "Free cancellation until 48 hours before", description: "Plans change. Cancel in two taps and the whole amount comes straight back." },
                { icon: <IconHeadphones />, title: "A real person, at any hour", description: "Locked out at midnight? Someone on our team answers within five minutes." },
              ],
              cta: { label: "Find a stay", href: "#guest" },
            },
          ]}
        />
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="The same block in a narrow column for a hiring site: the sides stack with a labelled divider between them, and the heading is set from the start">
          <TwoSidedFeatures
            headingLevel={3}
            align="start"
            title="Hiring that works from both ends"
            sides={[
              {
                label: "For employers",
                heading: "Meet people who already want the job",
                benefits: [
                  { icon: <IconUserCheck />, title: "A shortlist in 48 hours", description: "We screen against your must-haves and send five profiles, not fifty." },
                  { icon: <IconEuro />, title: "Pay when someone starts", description: "No upfront fee. The invoice comes after their first day." },
                ],
                cta: { label: "Post a role", href: "#employer" },
              },
              {
                label: "For candidates",
                heading: "Apply once and hear back every time",
                benefits: [
                  { icon: <IconMessage />, title: "A reply to every application", description: "Employers answer within five working days, or the listing says they did not." },
                  { icon: <IconEyeOff />, title: "Hidden from your employer", description: "Block named companies from seeing your profile. Show it to everyone else." },
                ],
                cta: { label: "Browse roles", href: "#candidate" },
              },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
