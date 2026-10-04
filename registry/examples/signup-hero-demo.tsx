"use client";

import { AvatarGroup, Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { SignupHero } from "@rhs-ui/marketing/signup-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <SignupHero
        eyebrow="Private beta"
        title="A calmer inbox starts in March."
        description="Quill sorts mail into what needs you today and what can wait. Join the beta and get in before the doors open."
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 700))}
        privacyNote="One email when your invite is ready. Nothing else."
        proof={
          <>
            <AvatarGroup>
              {["AK", "JM", "SR", "TB"].map((initials) => (
                <Avatar key={initials} size="sm"><AvatarFallback>{initials}</AvatarFallback></Avatar>
              ))}
            </AvatarGroup>
            2,418 people are waiting
          </>
        }
      />
    </div>
  );
}
