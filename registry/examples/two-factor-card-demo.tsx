"use client";

import { TwoFactorCard } from "@rhs-ui/application/two-factor-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md justify-center p-8">
      <TwoFactorCard
        titleAs="h2"
        destination="your authenticator app"
        onVerify={(code) => new Promise<boolean>((resolve) => setTimeout(() => resolve(code === "123456"), 600))}
        alternative={<a href="#recovery" className="underline underline-offset-4 hover:text-foreground">Use a recovery code instead</a>}
      />
    </div>
  );
}
