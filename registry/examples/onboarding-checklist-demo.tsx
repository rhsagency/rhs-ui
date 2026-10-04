"use client";

import { Button } from "@rhs-ui/primitives/button";
import { OnboardingChecklist } from "@rhs-ui/application/onboarding-checklist";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg p-6">
      <OnboardingChecklist
        onDismiss={() => undefined}
        steps={[
          { id: "account", title: "Create your account", description: "Done in the sign-up.", done: true },
          { id: "team", title: "Invite your team", description: "Projects work best with the people who do the work.", done: true },
          { id: "domain", title: "Connect your domain", description: "Point a domain you own at your site. It takes about five minutes.", done: false, action: <Button size="sm">Connect a domain</Button> },
          { id: "payments", title: "Turn on payments", description: "Accept cards, wallets and iDEAL from your first order.", done: false, action: <Button size="sm" variant="outline">Set up payments</Button> },
        ]}
      />
    </div>
  );
}
