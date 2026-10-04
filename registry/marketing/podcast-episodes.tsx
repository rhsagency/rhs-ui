import { IconPlay } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PodcastEpisode {
  href: string;
  number: number;
  title: string;
  guest?: string;
  summary: string;
  /** "42 min". */
  duration: string;
  date: string;
  dateTime: string;
}

export interface PodcastEpisodesProps {
  title: string;
  description?: string;
  /** Where to subscribe: "Apple Podcasts", "Spotify", "RSS". */
  subscribe?: readonly { label: string; href: string }[];
  episodes: readonly PodcastEpisode[];
  className?: string;
}

/**
 * A podcast's episode list: number, title, guest, a line about it, length
 * and date, with a play affordance per row and the subscribe links on top.
 * Each row is one link to the episode page, where the player lives.
 */
export function PodcastEpisodes({ title, description, subscribe = [], episodes, className }: PodcastEpisodesProps) {
  return (
    <section data-slot="podcast-episodes" className={cn("py-16 sm:py-20", className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-3xl font-medium tracking-[-.04em]">{title}</h2>
          {description ? <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
        {subscribe.length ? (
          <ul aria-label="Subscribe" className="flex flex-wrap gap-2">
            {subscribe.map((link) => (
              <li key={`${link.href}-${link.label}`}><a href={link.href} className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">{link.label}</a></li>
            ))}
          </ul>
        ) : null}
      </div>
      <ol className="mt-10 space-y-3">
        {episodes.map((episode) => (
          <li key={`${episode.href}-${episode.number}`}>
            <a href={episode.href} className="group grid grid-cols-[auto_1fr] items-start gap-4 rounded-2xl border border-border p-5 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:scale-105 motion-reduce:transition-none [&_svg]:size-4"><IconPlay /></span>
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Episode {episode.number}{episode.guest ? ` · with ${episode.guest}` : ""}</span>
                <span className="mt-0.5 block font-medium text-balance">{episode.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{episode.summary}</span>
              </span>
              <span className="col-start-2 text-xs text-muted-foreground tabular-nums sm:col-start-auto sm:text-right">
                {episode.duration}<br className="hidden sm:block" /><span className="sm:hidden"> · </span><time dateTime={episode.dateTime}>{episode.date}</time>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
