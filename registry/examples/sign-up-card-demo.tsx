"use client";

import { Button } from "@rhs-ui/primitives/button";
import { SignUpCard } from "@rhs-ui/application/sign-up-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md justify-center p-8">
      <SignUpCard
        titleAs="h2"
        providers={<Button variant="outline">Continue with Google</Button>}
        terms={<>By creating an account you agree to the <a href="#terms">terms</a> and <a href="#privacy">privacy policy</a>.</>}
        footer={<>Already have an account? <a href="#sign-in" className="ml-1 font-medium text-foreground underline underline-offset-4">Sign in</a></>}
        onSubmit={({ email }) => new Promise<string | void>((resolve) => setTimeout(() => resolve(email.endsWith("@example.com") ? "That email already has an account. Sign in instead?" : undefined), 600))}
      />
    </div>
  );
}
