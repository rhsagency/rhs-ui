"use client";

import { CallbackRequest } from "@rhs-ui/marketing/callback-request";

export default function Demo(): React.JSX.Element {
  return (
    <div className="px-6">
      <CallbackRequest
        title="Rather talk it through?"
        description="Leave your number and we call you, on a weekday, at a time that suits."
        slots={[
          { value: "morning", title: "Morning", description: "9 to 12" },
          { value: "afternoon", title: "Afternoon", description: "12 to 17" },
          { value: "evening", title: "Evening", description: "17 to 20" },
        ]}
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 600))}
        note="We only use your number for this call."
      />
    </div>
  );
}
