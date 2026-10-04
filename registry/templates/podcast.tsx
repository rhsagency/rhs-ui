"use client";
import { useState } from "react";

import { IconHeadphones, IconPause, IconPlay, IconRss } from "@rhs-ui/icons";
import { FooterMinimal } from "@rhs-ui/marketing/footer-minimal";
import { NewsletterSection } from "@rhs-ui/marketing/newsletter-section";
import { TestimonialGrid } from "@rhs-ui/marketing/testimonial-grid";
import { Button } from "@rhs-ui/primitives/button";
import { Slider } from "@rhs-ui/primitives/slider";

export interface PodcastEpisode {
  id: string;
  number: number;
  title: string;
  guest: string;
  /** Minutes. */
  length: number;
  date: string;
  summary: string;
}

export interface PodcastProps {
  show?: string;
  episodes?: readonly PodcastEpisode[];
  onSubscribe?: (email: string) => Promise<void> | void;
}

const EPISODES: PodcastEpisode[] = [
  { id: "42", number: 42, title: "Why the best teams write everything down", guest: "Mara Lindqvist", length: 54, date: "8 April 2026", summary: "Decision logs, quiet meetings and the memo that replaced a weekly call." },
  { id: "41", number: 41, title: "Pricing without a sales team", guest: "Jonas Meier", length: 47, date: "1 April 2026", summary: "How a twelve-person company grew to 4,000 customers on self-serve plans." },
  { id: "40", number: 40, title: "Designing for people who are tired", guest: "Priya Nair", length: 61, date: "25 March 2026", summary: "Clinic software, shift work and interfaces that forgive." },
  { id: "39", number: 39, title: "The four-day week, two years in", guest: "Tom Becker", length: 39, date: "18 March 2026", summary: "What went right, what broke, and what they would do again." },
];

/**
 * A podcast site: the show and where to listen, a player for the newest
 * episode with a working scrubber, the episode list that loads into the
 * player, listener quotes and a newsletter. Bring your own audio element.
 */
export function Podcast({ show = "Slow Build", episodes = EPISODES, onSubscribe = () => undefined }: PodcastProps): React.JSX.Element {
  const [current, setCurrent] = useState(episodes[0]);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const total = (current?.length ?? 0) * 60;
  const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  return (
    <div data-slot="podcast" className="bg-background text-foreground">
      <header className="dark bg-background text-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-sm">
          <a href="#top" className="flex items-center gap-2 font-semibold"><IconHeadphones size={18} />{show}</a>
          <a href="#episodes" className="text-muted-foreground">Episodes</a>
        </div>
        <section id="top" className="mx-auto grid max-w-6xl gap-10 px-6 pt-10 pb-20 md:grid-cols-[1fr_20rem] md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">A podcast about building calm companies</p>
            <h1 className="mt-5 text-6xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-7xl">{show}</h1>
            <p className="mt-6 max-w-md text-muted-foreground">Founders and operators on the unglamorous decisions that made their companies last. New episode every Tuesday.</p>
            <div className="mt-8 flex flex-wrap gap-2">{["Apple Podcasts", "Spotify", "Pocket Casts"].map((app) => <Button key={app} variant="outline" size="sm">{app}</Button>)}<Button variant="ghost" size="sm"><IconRss /> RSS</Button></div>
          </div>
          {current ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-5" aria-label="Player">
              <p className="text-xs text-muted-foreground">Episode {current.number}</p>
              <p className="mt-1 font-medium leading-snug">{current.title}</p>
              <p className="text-sm text-muted-foreground">with {current.guest}</p>
              <Slider className="mt-5" value={[position]} min={0} max={total} step={1} thumbLabels={["Position"]} onValueChange={([value]) => setPosition(value ?? 0)} />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums"><span>{clock(position)}</span><span>−{clock(total - position)}</span></div>
              <Button className="mt-4 w-full" onClick={() => setPlaying(!playing)} aria-pressed={playing}>{playing ? <><IconPause /> Pause</> : <><IconPlay /> Play episode</>}</Button>
            </div>
          ) : null}
        </section>
      </header>
      <section id="episodes" className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.03em]">All episodes</h2>
        <ol className="mt-8 divide-y divide-border border-y border-border">
          {episodes.map((episode) => (
            <li key={episode.id} className="grid gap-3 py-6 sm:grid-cols-[4rem_1fr_auto] sm:items-center">
              <span className="font-mono text-sm text-muted-foreground">#{episode.number}</span>
              <div>
                <h3 className="font-medium">{episode.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{episode.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">{episode.guest} · {episode.length} min · {episode.date}</p>
              </div>
              <Button variant={current?.id === episode.id ? "default" : "outline"} size="sm" onClick={() => { setCurrent(episode); setPosition(0); setPlaying(true); }} aria-label={`Play episode ${episode.number}: ${episode.title}`}><IconPlay /> Play</Button>
            </li>
          ))}
        </ol>
      </section>
      <div className="mx-auto max-w-6xl px-6">
        <TestimonialGrid title="Listeners say" testimonials={[{ id: "1", name: "Lea", role: "Founder", quote: "The only business podcast I finish." }, { id: "2", name: "Sam", role: "Product lead", quote: "Episode 38 changed how we run planning." }, { id: "3", name: "Ines", role: "Designer", quote: "Calm voices, sharp questions." }]} />
        <NewsletterSection title="Show notes in your inbox" description="Every Tuesday: the episode, the links and one question to try at work." onSubmit={onSubscribe} />
        <FooterMinimal brand={<span className="font-semibold">{show}</span>} links={[{ label: "Episodes", href: "#episodes" }, { label: "Sponsor", href: "#top" }, { label: "Privacy", href: "#top" }]} legal={`© 2026 ${show}. Illustrative template.`} />
      </div>
    </div>
  );
}
