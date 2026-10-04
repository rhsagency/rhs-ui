"use client";

import { AiMessage } from "@rhs-ui/application/ai-message";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <AiMessage role="user" text="Can you summarise last week's support tickets in three lines?" />
      <AiMessage
        role="assistant"
        text="Most tickets were about exports timing out. Two customers asked for SSO. Response time held at 11 minutes."
        onRegenerate={() => undefined}
      >
        <ul>
          <li>Most tickets (41 of 96) were about <code>CSV</code> exports timing out.</li>
          <li>Two enterprise customers asked for single sign-on.</li>
          <li>Median first response held at 11 minutes.</li>
        </ul>
      </AiMessage>
      <AiMessage role="assistant" text="Drafting a reply to the export tickets" streaming />
    </div>
  );
}
