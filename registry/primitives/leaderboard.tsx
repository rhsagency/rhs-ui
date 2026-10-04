import { cn } from "@/lib/utils";

export interface LeaderboardEntry {
  id: string;
  name: string;
  /** A second line: a team, a city. */
  detail?: string;
  score: number;
  /** Places moved since the last period: +2, -1, 0. */
  change?: number;
  /** Mark the reader's own row. */
  you?: boolean;
}

export interface LeaderboardProps {
  title: string;
  entries: readonly LeaderboardEntry[];
  /** How a score is printed: "1,240 pts". */
  unit?: string;
  locale?: string;
  className?: string;
}

/**
 * A ranked list for sales targets, challenges or games: rank, person, a bar
 * against the leader, the score and how far they moved, with the reader's
 * own row marked in words. Sorted by score, highest first.
 */
export function Leaderboard({ title, entries, unit = "", locale = "en-GB", className }: LeaderboardProps) {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score || 1;
  const number = new Intl.NumberFormat(locale);
  return (
    <section data-slot="leaderboard" aria-label={title} className={cn("rounded-xl border border-border", className)}>
      <h3 className="border-b border-border px-5 py-3 text-sm font-medium">{title}</h3>
      <ol className="divide-y divide-border">
        {sorted.map((entry, index) => (
          <li key={entry.id} className={cn("grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-3", entry.you && "bg-muted/60")}>
            <span className={cn("text-sm tabular-nums", index < 3 ? "font-semibold" : "text-muted-foreground")}>{index + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{entry.name}{entry.you ? <span className="ml-2 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-normal text-background">You</span> : null}</p>
              {entry.detail ? <p className="truncate text-xs text-muted-foreground">{entry.detail}</p> : null}
              <div className="mt-1.5 h-1 rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-foreground" style={{ width: `${(entry.score / top) * 100}%` }} /></div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium tabular-nums">{number.format(entry.score)}{unit ? ` ${unit}` : ""}</p>
              {entry.change ? <p className={cn("text-xs tabular-nums", entry.change > 0 ? "text-foreground" : "text-muted-foreground")}>{entry.change > 0 ? `▲ ${entry.change}` : `▼ ${-entry.change}`}<span className="sr-only"> places</span></p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
