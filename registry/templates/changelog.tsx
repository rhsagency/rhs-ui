"use client";
import { useState, type FormEvent } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconRss, IconSparkle } from "@rhs-ui/icons";
import { Reveal } from "@rhs-ui/motion/reveal";
import { ScrollProgress } from "@rhs-ui/motion/scroll-progress";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";

export type ChangeKind = "new" | "improved" | "fixed";
export interface Release { version: string; date: string; title: string; summary: string; changes: readonly { kind: ChangeKind; text: string }[] }

export interface ChangelogProps {
  product?: string;
  releases?: readonly Release[];
  onSubscribe?: (email: string) => Promise<void> | void;
}

const RELEASES: Release[] = [
  {
    version: "4.2", date: "24 September 2026", title: "Shared views and a faster search",
    summary: "Save a filtered view and share it with a link. Search now answers in under 100 ms on every workspace.",
    changes: [
      { kind: "new", text: "Shared views: save filters, sorting and columns, and share them with your team." },
      { kind: "improved", text: "Search is up to eight times faster on large workspaces." },
      { kind: "fixed", text: "Dates in exports now follow your workspace timezone." },
    ],
  },
  {
    version: "4.1", date: "9 September 2026", title: "Keyboard first",
    summary: "Everything you do with the mouse now has a shortcut, and Cmd K finds all of them.",
    changes: [
      { kind: "new", text: "A command menu on Cmd K with every action in the app." },
      { kind: "improved", text: "Focus is kept when you close a dialog, so you can keep typing." },
      { kind: "fixed", text: "The date picker no longer opens behind the sidebar on small screens." },
    ],
  },
  {
    version: "4.0", date: "21 August 2026", title: "A calmer interface",
    summary: "A redesign that removes a third of the chrome. Same features, less to look at.",
    changes: [
      { kind: "new", text: "Dark mode that follows your system, with a manual override." },
      { kind: "improved", text: "Tables load progressively and keep your scroll position." },
      { kind: "improved", text: "Notifications are grouped by project." },
    ],
  },
];

const KIND_LABEL: Record<ChangeKind, string> = { new: "New", improved: "Improved", fixed: "Fixed" };

/**
 * A changelog: the latest release first, each with its date, a headline
 * and a short summary, changes tagged new, improved or fixed with a filter,
 * a reading progress bar, and a subscribe box that confirms in place.
 */
export function Changelog({ product = "Outline", releases = RELEASES, onSubscribe }: ChangelogProps): React.JSX.Element {
  const [kind, setKind] = useState<"all" | ChangeKind>("all");
  const [subscribed, setSubscribed] = useState(false);
  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubscribe?.(String(new FormData(event.currentTarget).get("email") ?? ""));
    setSubscribed(true);
  };
  return (
    <div data-slot="changelog" className="bg-background text-foreground">
      <ScrollProgress className="fixed inset-x-0 top-0 z-50" />
      <nav aria-label="Product" className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 text-sm sm:px-10">
          <a href="#changelog-top" className="font-semibold tracking-tight">{product}</a>
          <a href="#changelog-subscribe" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><IconRss size={16} /> Subscribe</a>
        </div>
      </nav>
      <header id="changelog-top" className="mx-auto max-w-5xl px-6 pt-20 pb-12 sm:px-10">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase"><IconSparkle size={14} /> Changelog</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">What is new in {product}.</h1>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <p className="text-sm text-muted-foreground">A release every two weeks. The last one was on {releases[0]?.date}.</p>
          <SegmentedControl label="Show" value={kind} onValueChange={(value) => setKind(value as typeof kind)} options={[{ value: "all", label: "All" }, { value: "new", label: "New" }, { value: "improved", label: "Improved" }, { value: "fixed", label: "Fixed" }]} />
        </div>
      </header>

      <ol className="mx-auto grid max-w-5xl gap-20 px-6 pb-24 sm:px-10">
        {releases.map((release) => {
          const changes = release.changes.filter((change) => kind === "all" || change.kind === kind);
          return (
            <li key={release.version} className="grid gap-6 md:grid-cols-[12rem_1fr]">
              <div className="md:sticky md:top-8 md:self-start">
                <p className="font-mono text-sm">v{release.version}</p>
                <time className="text-sm text-muted-foreground">{release.date}</time>
              </div>
              <Reveal>
                <div aria-hidden="true" className="mb-6 rounded-2xl border border-border bg-muted p-5">
                  <div className="grid grid-cols-[7rem_1fr] gap-4 rounded-xl border border-border bg-background p-4">
                    <div className="grid content-start gap-2.5 border-r border-border pr-4">
                      {[70, 55, 80, 45, 60].map((width, i) => <span key={i} className={`h-2 rounded-full ${i === 1 ? "bg-foreground/70" : "bg-muted"}`} style={{ width: `${width}%` }} />)}
                    </div>
                    <div className="grid content-start gap-2">
                      <span className="mb-1 h-3 w-2/5 rounded-full bg-foreground/80" />
                      {[0, 1, 2, 3].map((row) => (
                        <span key={row} className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${row === 1 ? "bg-foreground/[0.06] ring-1 ring-foreground/15" : ""}`}>
                          <span className="size-3 rounded-full border border-muted-foreground/40" />
                          <span className="h-2 flex-1 rounded-full bg-muted" style={{ maxWidth: `${[80, 65, 72, 50][row]}%` }} />
                          {row === 1 ? <span className="rounded-full bg-foreground px-1.5 text-[9px] text-background">{release.version}</span> : null}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">{release.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{release.summary}</p>
                <ul className="mt-6 grid gap-3">
                  {changes.map((change) => (
                    <li key={change.text} className="flex items-start gap-3 text-sm">
                      <Badge variant={change.kind === "new" ? "default" : "outline"} className="mt-0.5 w-20 justify-center">{KIND_LABEL[change.kind]}</Badge>
                      <span className="leading-relaxed">{change.text}</span>
                    </li>
                  ))}
                  {!changes.length ? <li className="text-sm text-muted-foreground">Nothing of this kind in {release.version}.</li> : null}
                </ul>
              </Reveal>
            </li>
          );
        })}
      </ol>

      <section id="changelog-subscribe" className="scroll-mt-6 border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-8 px-6 py-16 sm:px-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Get the next release in your inbox.</h2>
            <p className="mt-1 text-sm text-muted-foreground">One email every two weeks. Or follow the RSS feed.</p>
          </div>
          {subscribed ? (
            <p role="status" className="text-sm">Subscribed. See you in two weeks.</p>
          ) : (
            <form onSubmit={subscribe} className="flex w-full max-w-sm gap-2">
              <label htmlFor="changelog-email" className="sr-only">Email address</label>
              <Input id="changelog-email" name="email" type="email" required placeholder="you@company.com" className="flex-1" />
              <Button type="submit">Subscribe</Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
