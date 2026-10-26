import { TopicHub } from "@rhs-ui/marketing/topic-hub";

const LATEST = [
  { title: "What a good handover document actually contains", date: "12 Oct 2026", dateTime: "2026-10-12" },
  { title: "Eight months of four-day weeks, in numbers", date: "28 Sep 2026", dateTime: "2026-09-28" },
  { title: "How we cut our weekly meetings from nine to three", date: "9 Sep 2026", dateTime: "2026-09-09" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <TopicHub
        headingLevel={2}
        eyebrow="Topic"
        title="Remote work"
        description="How distributed teams really run: hiring across time zones, meetings that survive a bad connection, and the habits that keep people from burning out at the kitchen table."
        facts={[
          { label: "Articles", value: "38" },
          { label: "Contributors", value: "11" },
          { label: "Last updated", value: <time dateTime="2026-10-12">12 Oct 2026</time> },
        ]}
        startHere={[
          { title: "What remote means when nobody agrees on it", href: "#what-remote-means", minutes: 7, blurb: "The vocabulary, so the rest of the topic makes sense." },
          { title: "Writing things down: the habit that makes it work", href: "#writing-things-down", minutes: 9, blurb: "Why teams that work asynchronously live or die on documentation." },
          { title: "Running a meeting across six time zones", href: "#six-time-zones", minutes: 6, blurb: "A format that works at 08:00 in Lisbon and at 17:00 in Singapore." },
          { title: "The first 90 days of a remote hire", href: "#first-90-days", minutes: 11, blurb: "What to send before day one, and what to stop sending." },
        ]}
        related={[
          { label: "Hiring", href: "#hiring", count: 24 },
          { label: "Management", href: "#management", count: 31 },
          { label: "Meetings", href: "#meetings", count: 17 },
          { label: "Documentation", href: "#documentation", count: 9 },
          { label: "Async communication", href: "#async", count: 14 },
          { label: "Wellbeing", href: "#wellbeing", count: 12 },
        ]}
      >
        <h3 className="text-xl font-medium tracking-[-0.025em]">Latest in remote work</h3>
        <ul role="list" className="mt-5 divide-y divide-border border-y border-border">
          {LATEST.map((article) => (
            <li key={article.title} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
              <a href="#article" className="rounded-sm text-base font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                {article.title}
              </a>
              <time dateTime={article.dateTime} className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                {article.date}
              </time>
            </li>
          ))}
        </ul>
      </TopicHub>

      <div className="mt-24 border-t border-border pt-12">
        <p className="mb-10 text-xs text-muted-foreground">A younger topic: three pieces, no facts and no related topics yet</p>
        <TopicHub
          headingLevel={2}
          title="Accessibility"
          description="Practical notes on building interfaces that work for everyone, written by the people who build ours."
          startHere={[
            { title: "A ten-minute accessibility check for any page", href: "#ten-minute-check", minutes: 10, blurb: "Keyboard, zoom and a screen reader, in that order." },
            { title: "Labels that survive translation", href: "#labels", minutes: 5, blurb: "Why the visible text and the accessible name should agree." },
            { title: "Colour is not a status", href: "#colour", minutes: 4, blurb: "Three ways to say it with words and shape instead." },
          ]}
        />
      </div>
    </div>
  );
}
