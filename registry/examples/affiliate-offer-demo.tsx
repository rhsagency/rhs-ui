import type { ReactNode } from "react";

import { AffiliateOffer, type AffiliateOfferProps } from "@rhs-ui/marketing/affiliate-offer";

const offer: AffiliateOfferProps = {
  eyebrow: "Partner programme",
  title: "Earn 30% for every team you bring to Kestrel",
  description: "Recommend Kestrel to your readers, clients or students and be paid for as long as they stay subscribed.",
  facts: [
    { value: "30%", label: "recurring commission on every payment" },
    { value: "90 days", label: "cookie window, so a late decision still counts" },
    { value: "Monthly", label: "payouts on the 15th, from €50" },
  ],
  steps: [
    { title: "Apply", description: "Tell us where your audience is. We read every application and answer within three working days." },
    { title: "Share your link", description: "You get a personal link, a short brief and our logos. Use them in articles, videos and newsletters." },
    { title: "Get paid", description: "Commission is paid each month for every team that is still subscribed, with a statement you can check." },
  ],
  audience: "Built for newsletter writers, YouTubers and consultants whose readers run small teams.",
  action: { label: "Apply to join", href: "#apply" },
  termsHref: "#terms",
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
      <Example caption="On a wide page: the figures run in a row and a line joins the steps. The terms link sits next to the button">
        <AffiliateOffer {...offer} />
      </Example>
      <div className="mt-16 max-w-md border-t border-border pt-10">
        <Example caption="In a narrow column: the figures and the steps stack, and the line runs down">
          <AffiliateOffer {...offer} headingLevel={3} title="Earn 30% for every team you refer" description={undefined} />
        </Example>
      </div>
    </div>
  );
}
