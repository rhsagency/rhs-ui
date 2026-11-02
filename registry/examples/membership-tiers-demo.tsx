import type { ReactNode } from "react";

import { MembershipTiers, type MembershipTier } from "@rhs-ui/marketing/membership-tiers";
import { Button } from "@rhs-ui/primitives/button";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const CLUB: MembershipTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    threshold: "Free to join",
    perks: ["Free delivery over €60", "Points on every order", "A birthday discount"],
  },
  {
    id: "silver",
    name: "Silver",
    threshold: "from €250 a year",
    perks: ["Everything in Bronze", "Free delivery on every order", "Free returns for 60 days", "Sale access one day early"],
  },
  {
    id: "gold",
    name: "Gold",
    threshold: "from €600 a year",
    perks: ["Everything in Silver", "Free express delivery", "Free repairs for life", "Invitations to launch evenings"],
  },
  {
    id: "platinum",
    name: "Platinum",
    threshold: "from €1,500 a year",
    perks: ["Everything in Gold", "A personal gear advisor", "An annual gear service day", "First pick of new releases"],
  },
];

const REGULARS: MembershipTier[] = [
  { id: "member", name: "Member", threshold: "From your first visit", perks: ["Your own bar stool and tab", "Ten per cent off at the roastery"] },
  { id: "regular", name: "Regular", threshold: "After 2 years", perks: ["Everything for Members", "A free filter coffee every Monday", "Your name on the board"] },
  { id: "founder", name: "Founder", threshold: "After 5 years", perks: ["Everything for Regulars", "A mug with your name, kept on the shelf", "A seat at the yearly tasting"] },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="What a visitor sees: three tiers and what each takes, with nothing marked. The rail joins them, and the action invites the visitor to start at the bottom">
        <MembershipTiers
          title="Earn your way up"
          description="Every euro you spend in a year moves you towards the next tier. Tiers are reviewed each January, on the last twelve months."
          tiers={CLUB.slice(0, 3)}
          cta={<Button size="lg">Join Northwind Club</Button>}
          note="Free to join. Your tier is reviewed every January."
        />
      </Example>

      <div className="mt-20 border-t border-border pt-12 sm:mt-24">
        <Example caption="What a member sees: their tier is marked in words and with aria-current, the tiers below say Reached, and the rail is filled up to a marker between Silver and Gold. The bar says the same in numbers: €420 of €600, 70% of the way to Gold">
          <MembershipTiers
            title="You are on Silver"
            description="Spend €180 more by the end of the year and you reach Gold on the first of January."
            tiers={CLUB}
            current="silver"
            progress={{ value: 420, nextAt: 600, currency: "EUR" }}
            cta={<Button size="lg" variant="outline">See what you have earned</Button>}
          />
        </Example>
      </div>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="Earned by time, in a narrow column: the ladder runs down the page, and the unit is months">
          <MembershipTiers
            headingLevel={3}
            title="The Kestrel regulars"
            tiers={REGULARS}
            current="regular"
            progress={{ value: 31, nextAt: 60, unit: "months" }}
          />
        </Example>
      </div>
    </div>
  );
}
