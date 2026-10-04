"use client";

import { ReadingProgress } from "@rhs-ui/primitives/reading-progress";

export default function Demo(): React.JSX.Element {
  return (
    <div className="relative mx-auto max-w-2xl p-6">
      <ReadingProgress target="reading-progress-article" className="absolute" />
      <article id="reading-progress-article" className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-2xl font-medium tracking-tight text-foreground">Why quiet software wins</h2>
        <p>Scroll this page: the bar at the top fills as you read the article and stops at its end, not at the footer.</p>
        <p>Every notification costs a little attention. Most tools spend it freely, because a ping is the cheapest way to look busy.</p>
        <p>We tried the opposite: one summary on Monday, and nothing after six. Usage went up, not down.</p>
      </article>
    </div>
  );
}
