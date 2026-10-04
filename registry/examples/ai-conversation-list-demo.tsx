"use client";

import { AiConversationList } from "@rhs-ui/application/ai-conversation-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto h-[26rem] max-w-64 p-6">
      <AiConversationList
        current="c2"
        onNew={() => undefined}
        conversations={[
          { id: "c1", title: "Price increase email subject", group: "Today", href: "#c1" },
          { id: "c2", title: "Q2 launch plan outline", group: "Today", href: "#c2" },
          { id: "c3", title: "SQL for churn by cohort", group: "Last 7 days", href: "#c3" },
          { id: "c4", title: "Interview questions for a designer", group: "Last 7 days", href: "#c4" },
          { id: "c5", title: "Summarise the March board notes", group: "March", href: "#c5" },
        ]}
      />
    </div>
  );
}
