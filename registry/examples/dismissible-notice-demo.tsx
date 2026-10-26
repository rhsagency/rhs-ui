"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconArchive, IconCommand, IconSparkle, IconTruck } from "@rhs-ui/icons";
import { Banner } from "@rhs-ui/primitives/banner";
import { Button } from "@rhs-ui/primitives/button";
import { DismissibleNotice, useDismissed, type UseDismissedOptions } from "@rhs-ui/primitives/dismissible-notice";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

/** False on the server and while hydrating, true in the browser: the "dismissed" line must not be printed for a notice the browser has not been asked about yet. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

/**
 * An invisible copy of a notice's card: the same padding, icon column, text, button and close column, so it is exactly as tall as the notice at every width. A notice is never in
 * the server HTML, so this copy keeps the room it will take until the page is live, and nothing below the preview moves when the page wakes up. It mirrors the card in
 * dismissible-notice/index.tsx: when that card changes shape, change this one with it.
 */
function NoticeGhost({ title, action, children }: { title: string; action: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="invisible flex items-start gap-3 border border-transparent p-4">
      <span className="size-8 shrink-0" />
      <div className="min-w-0 flex-1 pt-[5px]">
        <p className="text-sm leading-snug font-medium tracking-[-0.01em]">{title}</p>
        <div className="mt-1 text-sm leading-relaxed">{children}</div>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">{action}</div>
      </div>
      <span className="-mr-1.5 size-7 shrink-0" />
    </div>
  );
}

/**
 * A caption, what it captions, and, once the person has closed it, a quiet line that says so and takes it back. `after` sits below both. Until the page is live `ghost` holds the
 * room of the notice under a dashed outline; it folds away just after the notice has folded in, or on its own when there is no notice to show. The ghost and the notice share
 * one grid cell, so the cell is as tall as the taller of the two, and nothing steps while one hands over to the other.
 */
function Remembered({ id, caption, options, ghost, after, children }: { id: string; caption: string; options?: UseDismissedOptions; ghost?: ReactNode; after?: ReactNode; children: ReactNode }): React.JSX.Element {
  const { dismissed, restore } = useDismissed(id, options);
  const hydrated = useHydrated();
  return (
    <div className="min-w-0">
      <p className="mb-3 text-xs text-muted-foreground">{caption}</p>
      <div className="grid grid-cols-[minmax(0,1fr)]">
        {ghost ? (
          <div
            aria-hidden="true"
            inert
            className={cn(
              "pointer-events-none col-start-1 row-start-1 grid transition-[grid-template-rows] delay-[260ms] duration-200 ease-out motion-reduce:transition-none motion-reduce:delay-0",
              hydrated ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
            )}
          >
            <div className="relative min-h-0 overflow-hidden">
              <span className="absolute inset-0 rounded-xl border border-dashed border-border" />
              {ghost}
            </div>
          </div>
        ) : null}
        <div className="relative col-start-1 row-start-1 min-w-0">{children}</div>
      </div>
      {hydrated && dismissed ? (
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
          Dismissed, and it stays that way after a reload.
          <button
            type="button"
            onClick={restore}
            className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            Show it again
          </button>
        </p>
      ) : null}
      {after ? <div className="mt-3">{after}</div> : null}
    </div>
  );
}

interface TipProps extends UseDismissedOptions {
  id: string;
  caption: string;
  icon: ReactNode;
  title: string;
  /** The label of the one button under the text. */
  action: string;
  after?: ReactNode;
  children: ReactNode;
}

/** A DismissibleNotice with its memory, its caption and the ghost that holds its room: the notice and its copy get the same title, text and button. */
function Tip({ id, caption, icon, title, action, version, remindAfterDays, after, children }: TipProps): React.JSX.Element {
  const button = (
    <Button variant="outline" size="sm">
      {action}
    </Button>
  );
  return (
    <Remembered
      id={id}
      caption={caption}
      options={{ version, remindAfterDays }}
      after={after}
      ghost={
        <NoticeGhost title={title} action={button}>
          {children}
        </NoticeGhost>
      }
    >
      <DismissibleNotice id={id} version={version} remindAfterDays={remindAfterDays} icon={icon} title={title} action={button}>
        {children}
      </DismissibleNotice>
    </Remembered>
  );
}

function DeliveryBanner({ className, onDismiss }: { className?: string; onDismiss?: () => void }): React.JSX.Element {
  return (
    <Banner tone="default" leading={<IconTruck />} action={<a href="#delivery">See the rules</a>} onDismiss={onDismiss} className={className}>
      Free delivery until Sunday.
    </Banner>
  );
}

const RELEASES = {
  "2.4": { title: "Bulk edit is here", text: "Select rows in Orders and change the status, tags or delivery date of all of them at once." },
  "2.5": { title: "Saved views for Orders", text: "Pin the filters you use every day and switch between them from the sidebar." },
} as const;
type Release = keyof typeof RELEASES;

const RELEASE_OPTIONS = [
  { value: "2.4", label: "Version 2.4" },
  { value: "2.5", label: "Version 2.5" },
] as const;

const IDS = ["demo-command-bar", "demo-release", "demo-backup", "demo-delivery"] as const;

export default function Demo(): React.JSX.Element {
  const [release, setRelease] = useState<Release>("2.4");
  const command = useDismissed(IDS[0]);
  const news = useDismissed(IDS[1], { version: release });
  const backup = useDismissed(IDS[2], { remindAfterDays: 7 });
  const delivery = useDismissed(IDS[3]);
  const hydrated = useHydrated();

  return (
    <div className="@container grid w-full max-w-4xl gap-8">
      <div className="grid grid-cols-1 gap-x-8 gap-y-9 @3xl:grid-cols-2">
        <Tip id={IDS[0]} caption="A tip with an action. Close it and it stays closed, on this page and the next" icon={<IconCommand />} title="Jump anywhere with the command bar" action="Try it now">
          Press{" "}
          <Kbd className="align-baseline">
            <span aria-hidden="true">⌘</span>
            <span className="sr-only">Command</span>
          </Kbd>{" "}
          <Kbd className="align-baseline">K</Kbd> to find an order, a customer or a setting without lifting your hands.
        </Tip>

        <Tip
          id={IDS[1]}
          caption="Versioned. Close it, then ship the next release: it comes back"
          version={release}
          icon={<IconSparkle />}
          title={RELEASES[release].title}
          action="See what changed"
          after={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-xs text-muted-foreground">Ship</span>
              <SegmentedControl label="Release shipped" value={release} onValueChange={(next) => setRelease(next as Release)} options={RELEASE_OPTIONS} />
            </div>
          }
        >
          {RELEASES[release].text}
        </Tip>

        <Tip
          id={IDS[2]}
          caption="Remind me later. A dismissal that lasts seven days"
          remindAfterDays={7}
          icon={<IconArchive />}
          title="Back up your catalogue"
          action="Export now"
        >
          A weekly export means a bad import never costs you a day. We will ask again in seven days.
        </Tip>

        <Remembered id={IDS[3]} caption="useDismissed gives a Banner the same memory">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {delivery.dismissed ? (
              // Not in the server HTML either: until the page is live, an invisible copy of the banner under a muted strip keeps its height.
              hydrated ? null : (
                <div aria-hidden="true" inert className="border-b border-border bg-muted/60">
                  <div className="invisible">
                    <DeliveryBanner className="border-b-0" />
                  </div>
                </div>
              )
            ) : (
              <DeliveryBanner onDismiss={delivery.dismiss} />
            )}
            <div aria-hidden="true" className="grid gap-2.5 p-5">
              <div className="h-2.5 w-2/5 rounded-full bg-muted" />
              <div className="h-2 w-4/5 rounded-full bg-muted/70" />
              <div className="h-2 w-3/5 rounded-full bg-muted/70" />
            </div>
          </div>
        </Remembered>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => {
            command.restore();
            news.restore();
            backup.restore();
            delivery.restore();
          }}
        >
          Show every notice again
        </Button>
        <p className="text-xs text-muted-foreground">Dismissals are kept in this browser only: localStorage, with a fallback to memory where it is blocked.</p>
      </div>
    </div>
  );
}
