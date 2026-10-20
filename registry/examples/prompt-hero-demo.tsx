"use client";

import { useState } from "react";

import { PromptHero } from "@rhs-ui/marketing/prompt-hero";

export default function Demo(): React.JSX.Element {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-6xl px-6">
      <PromptHero
        title="Tell Atlas where you want to go."
        description="Describe the trip in your own words. Atlas drafts the days, the stays and the budget while you watch."
        placeholder="A long weekend in Lisbon for two, mostly food and walking, under €1,200"
        examples={[
          "Five days in Kyoto in cherry blossom season",
          "A car-free week in the Dolomites with two kids",
          "Three cities in Portugal by train, under €1,500",
        ]}
        onSubmit={async (prompt) => {
          await new Promise((resolve) => setTimeout(resolve, 700));
          setSent(prompt);
        }}
        next="Next, we save your prompt and ask you to create a free account."
        capabilities={["Day-by-day itineraries", "Flights and stays compared", "Edit it by chatting"]}
      />
      <p role="status" className="pb-8 text-center text-xs text-muted-foreground">
        {sent ? `Handed to your app: “${sent}”` : "Type a prompt and send it to see what your app receives."}
      </p>
    </div>
  );
}
