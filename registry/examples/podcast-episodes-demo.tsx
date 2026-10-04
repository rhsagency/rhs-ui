import { PodcastEpisodes } from "@rhs-ui/marketing/podcast-episodes";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6">
      <PodcastEpisodes
        title="Slow Build"
        description="Conversations with people who build companies at a human pace. New episode every other Tuesday."
        subscribe={[{ label: "Apple Podcasts", href: "#apple" }, { label: "Spotify", href: "#spotify" }, { label: "RSS", href: "#rss" }]}
        episodes={[
          { href: "#42", number: 42, title: "Why the best teams write everything down", guest: "Mara Lindqvist", summary: "On decision logs, async updates and the meeting nobody misses.", duration: "48 min", date: "8 April 2026", dateTime: "2026-04-08" },
          { href: "#41", number: 41, title: "Pricing without the dark patterns", guest: "Luca Romano", summary: "How a subscription business grew after making cancelling easy.", duration: "41 min", date: "25 March 2026", dateTime: "2026-03-25" },
          { href: "#40", number: 40, title: "Hiring your first designer", summary: "What to look for, what to pay and what the first month should look like.", duration: "36 min", date: "11 March 2026", dateTime: "2026-03-11" },
        ]}
      />
    </div>
  );
}
