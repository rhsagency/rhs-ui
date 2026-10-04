"use client";

import { FeedbackWidget } from "@rhs-ui/primitives/feedback-widget";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl border-t border-border p-8">
      <FeedbackWidget onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 500))} />
    </div>
  );
}
