"use client";

import { ForgotPasswordCard } from "@rhs-ui/application/forgot-password-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md justify-center p-8">
      <ForgotPasswordCard
        titleAs="h2"
        onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
        footer={<a href="#sign-in" className="underline underline-offset-4 hover:text-foreground">Back to sign in</a>}
      />
    </div>
  );
}
