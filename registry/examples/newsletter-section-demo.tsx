"use client";

import { NewsletterSection } from "@rhs-ui/marketing/newsletter-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <NewsletterSection
        title="The Field Notes letter"
        description="One essay a month on building calm software, plus the three links we could not stop thinking about."
        promise="Monthly. Unsubscribe in one click. No tracking pixels."
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 600))}
      />
    </div>
  );
}
