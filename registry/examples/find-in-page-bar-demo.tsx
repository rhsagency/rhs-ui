"use client";

import { useRef, useState, type ReactNode } from "react";

import { FindInPageBar, type FindMatches, type FindOptions } from "@rhs-ui/application/find-in-page-bar";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";

const PARAGRAPHS = [
  "On 3 November, between 08:14 and 09:02 UTC, search requests served from the EU cluster saw elevated latency. The median stayed close to normal, but the slowest one in a hundred requests took more than four seconds, and the dashboards showed the latency climbing for forty minutes before anyone was paged.",
  "The first alert fired on error rate, not on latency. Our latency alarm watches the median, and a median hides a long tail. We have changed it to watch the 99th percentile, with a threshold set from the last ninety days of real traffic rather than from a guess.",
  "The cause was a change to the index warm-up. A deploy on the evening of 2 November moved warm-up from the start of each node to the first request it served. Nodes that came back after the nightly restart answered their first queries from a cold cache, and cold queries are what drove the latency.",
  "Customers noticed in two places. Autocomplete felt sluggish, and the export of large result sets timed out for three accounts. Support received eleven tickets, all of them about speed, and none about wrong results. Search never returned stale data during the incident.",
  "We rolled the warm-up change back at 09:02, and latency returned to normal within four minutes. A rollback took longer than it should have: the runbook still pointed at the old deploy tool, so the on-call engineer spent twelve minutes finding the right command.",
  "What went well: the rollback itself was safe, the status page was updated within ten minutes of the page, and the support team had a clear message about latency before the first ticket arrived. What did not: we alerted on the wrong signal and rehearsed the wrong tool.",
  "Follow-ups are owned and dated. Alert on p99 latency by 12 November. Update the runbook and rehearse a rollback with the whole rota by 19 November. Warm every node before it takes traffic, and make that a check the deploy cannot skip, by 26 November. Review the new latency alarm after a month.",
] as const;

/** A build log with a few hundred lines, written from a short list so the demo has real text to search. */
const LOG: readonly string[] = (() => {
  const services = ["gateway", "search", "indexer", "billing", "auth"];
  const notes: readonly (readonly [string, string])[] = [
    ["INFO", "accepted 412 connections"],
    ["INFO", "warm-up finished in 1.8 s"],
    ["WARN", "retrying upstream after a slow response"],
    ["INFO", "cache hit ratio 0.94"],
    ["ERROR", "upstream timeout after 4000 ms"],
    ["INFO", "deploy 7c1f2a promoted to 25% of traffic"],
    ["INFO", "no error budget burned in the last hour"],
    ["ERROR", "connection reset by peer"],
    ["INFO", "rollback rehearsal completed"],
    ["WARN", "p99 latency above 800 ms for 3 minutes"],
  ];
  return Array.from({ length: 64 }, (_, index) => {
    const [level, text] = notes[(index * 7 + 3) % notes.length] as readonly [string, string];
    const elapsed = index * 3;
    const minute = String(14 + Math.floor(elapsed / 60)).padStart(2, "0");
    const second = String(elapsed % 60).padStart(2, "0");
    return `08:${minute}:${second}  ${level.padEnd(5)}  ${(services[index % services.length] as string).padEnd(8)}  ${text}`;
  });
})();

export default function Demo(): React.JSX.Element {
  const article = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [summary, setSummary] = useState<FindMatches | null>(null);
  const [options, setOptions] = useState<FindOptions>({ caseSensitive: true, wholeWord: true });

  return (
    <div className="grid w-full gap-10">
      <Case
        caption="An incident review with the bar open. The matches are painted without touching the text (the CSS Custom Highlight API), the current one is stronger and brought into view with room around it. Enter and Shift with Enter step through them; Escape closes and clears. Click in the text and press Ctrl or Cmd with F to open it again."
        action={
          <Button variant="outline" size="sm" aria-pressed={open} onClick={() => setOpen((value) => !value)}>
            Find in article
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>F</Kbd>
            </KbdGroup>
          </Button>
        }
      >
        {/* The bar is two rows when its wrapper is narrower than 29.5rem (the bar's own 28rem and a margin of 0.75rem on each side), so the room above the text is made as high as the bar from then on. */}
        <div className="@container relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div
            ref={article}
            role="region"
            aria-label="Incident review"
            tabIndex={0}
            className="relative max-h-[26rem] overflow-y-auto px-5 pt-16 pb-5 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 sm:px-8 sm:pb-7 @max-[29.5rem]:pt-28"
          >
            <article className="mx-auto max-w-prose">
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Incident review: slow search on the EU cluster</h2>
              <p className="mt-1 text-xs text-muted-foreground">3 November 2026 · Reviewed by the platform team</p>
              <div className="mt-5 grid gap-4 text-sm leading-relaxed">
                {PARAGRAPHS.map((text) => (
                  <p key={text.slice(0, 24)}>{text}</p>
                ))}
              </div>
            </article>
          </div>
          <FindInPageBar containerRef={article} open={open} onOpenChange={setOpen} defaultQuery="latency" onMatchesChange={setSummary} labels={{ label: "Find in the article" }} />
        </div>
        <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground tabular-nums">
          {summary && summary.query ? `${summary.total} matches for “${summary.query}”, on number ${summary.current}.` : "Type to search."}
        </p>
      </Case>

      <Case caption="A build log, searched case sensitive and for whole words, and marked with wrapper marks (highlight=&quot;marks&quot;), which is what a browser without the Highlight API gets. ERROR is found; error inside a sentence is not. The two options are real pressed buttons, controlled from here.">
        <div className="@container relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div
            ref={log}
            role="region"
            aria-label="Build log"
            tabIndex={0}
            className="relative max-h-72 overflow-auto bg-muted/30 px-5 pt-16 pb-4 font-mono text-xs leading-6 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 @max-[29.5rem]:pt-28"
          >
            {LOG.map((line, index) => (
              <div key={`${index}-${line.slice(0, 8)}`} className="whitespace-pre">
                {line}
              </div>
            ))}
          </div>
          <FindInPageBar containerRef={log} defaultOpen defaultQuery="ERROR" highlight="marks" caseSensitive={options.caseSensitive} wholeWord={options.wholeWord} onOptionsChange={setOptions} labels={{ label: "Find in the log" }} />
        </div>
      </Case>
    </div>
  );
}

function Case({ caption, action, children }: { caption: string; action?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
        {action}
      </div>
      {children}
    </div>
  );
}
