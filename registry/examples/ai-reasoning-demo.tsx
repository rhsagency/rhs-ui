"use client";

import { AiReasoning } from "@rhs-ui/application/ai-reasoning";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <AiReasoning thinking>
        <p>Looking at the three plans and the team size you gave.</p>
      </AiReasoning>
      <AiReasoning thinking={false} seconds={4} defaultOpen>
        <p>The team has 14 people, so Starter (3 seats) is out.</p>
        <p>They need SSO, which only Business includes, so Business is the only plan that fits.</p>
      </AiReasoning>
    </div>
  );
}
