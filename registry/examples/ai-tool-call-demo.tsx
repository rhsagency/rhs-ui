"use client";

import { AiToolCall } from "@rhs-ui/application/ai-tool-call";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 p-6">
      <AiToolCall name="Search the help centre" status="done" summary="6 articles found" input={{ query: "export timeout", limit: 6 }} output={["Large exports", "Export formats", "Scheduled exports"]} />
      <AiToolCall name="Create a ticket" status="running" summary="Writing to the support queue" input={{ title: "Exports time out above 10k rows", priority: "high" }} />
      <AiToolCall name="Send email" status="error" summary="The mail service did not answer within 30 s" input={{ to: "team@example.com" }} />
    </div>
  );
}
