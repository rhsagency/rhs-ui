"use client";

import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import {
  IconAlertCircle,
  IconCheck,
  IconChevronRight,
  IconCompass,
  IconEyeOff,
  IconHistory,
  IconMegaphone,
  IconPin,
  IconSliders,
  IconSpinner,
  IconTarget,
  IconThumbsDown,
  IconTrendUp,
  IconUserCheck,
  IconUsers,
} from "@rhs-ui/icons";
import {
  DEFAULT_KINDS,
  DEFAULT_LABELS,
  fill,
  isThenable,
  messageOf,
  type ReasonKind,
  type RecommendationReason,
  type RecommendationReasonLabels,
  type Sponsorship,
} from "@rhs-ui/application/recommendation-reason-popover/reasons";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface RecommendationReasonPanelProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  /** The reasons, in plain language, most important first. */
  reasons: readonly RecommendationReason[];
  /** Set for an ad: who paid, and what that means. The panel says so first. */
  sponsored?: Sponsorship;
  /** Asks for less of this kind of thing. Return a promise and the row shows a spinner, then its confirmation; if it rejects the row goes back and says why. Leave it out for no such button. */
  onLessLikeThis?: () => void | Promise<void>;
  /** Hides this item. Same as above. Leave it out for no such button. */
  onHide?: () => void | Promise<void>;
  /** Where the settings for personalisation live. Leave it out for no link. */
  settingsHref?: string;
  /** The heading. Default "Why am I seeing this?" */
  title?: string;
  /** The words the panel says, for translation. */
  labels?: RecommendationReasonLabels;
  /** The element that closes the panel, drawn beside the title. The popover puts its close button here. */
  close?: ReactNode;
  /** The id of the title, so a dialog can be named by it. */
  titleId?: string;
}

/** The failure text, darkened toward the foreground so small red words reach 4.5:1. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

const KIND_ICON = {
  activity: IconHistory,
  interest: IconTarget,
  popular: IconTrendUp,
  location: IconPin,
  similar: IconUsers,
  following: IconUserCheck,
  context: IconCompass,
} as const satisfies Record<ReasonKind, unknown>;

/** A row at the foot that is a real button: it asks, spins while it saves, and then says what it did, in its own place. */
const ROW = [
  "group/row flex min-h-9 w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm outline-none",
  "transition-colors duration-150 motion-reduce:transition-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40",
  "aria-disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
].join(" ");

type Phase = "idle" | "pending" | "done";

function ActionRow({ icon, label, done, phase, onPress }: { icon: ReactNode; label: string; done: string; phase: Phase; onPress: () => void }) {
  return (
    <button type="button" aria-disabled={phase !== "idle" || undefined} aria-busy={phase === "pending" || undefined} onClick={onPress} className={cn(ROW, phase === "done" && "text-muted-foreground")}>
      <span aria-hidden="true" className={cn("grid size-4 place-items-center", phase === "idle" && "text-muted-foreground")}>
        {phase === "pending" ? <IconSpinner /> : phase === "done" ? <IconCheck className="text-foreground" /> : icon}
      </span>
      <span className="min-w-0 flex-1 leading-snug text-pretty">{phase === "done" ? done : label}</span>
    </button>
  );
}

/**
 * The explanation itself, as the content of a card: an ad says it is one first and who paid; then the reasons in plain
 * words with the kind of signal behind each; then real buttons to see less of this or to hide it, which confirm in their
 * own place, and a link to the settings. It is what RecommendationReasonPopover shows, usable by itself in a sheet or a
 * page about how recommendations work.
 */
export function RecommendationReasonPanel({
  reasons,
  sponsored,
  onLessLikeThis,
  onHide,
  settingsHref,
  title,
  labels,
  close,
  titleId,
  className,
  ...props
}: RecommendationReasonPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const kinds: Record<ReasonKind, string> = { ...DEFAULT_KINDS, ...labels?.kinds };
  const ownTitleId = useId();
  const [less, setLess] = useState<Phase>("idle");
  const [hidden, setHidden] = useState<Phase>("idle");
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState("");
  const working = useRef(false);

  async function run(handler: (() => void | Promise<void>) | undefined, phase: Phase, setPhase: (next: Phase) => void, done: string) {
    if (!handler || working.current || phase !== "idle") return;
    setProblem("");
    setSaid("");
    let outcome: void | Promise<void>;
    try {
      outcome = handler();
    } catch (error) {
      fail(error);
      return;
    }
    // An answer that is already here needs no busy state; a promise shows a spinner while it runs.
    if (!isThenable(outcome)) {
      setPhase("done");
      setSaid(done);
      return;
    }
    working.current = true;
    setPhase("pending");
    setSaid(words.saving);
    try {
      await outcome;
      setPhase("done");
      setSaid(done);
    } catch (error) {
      setPhase("idle");
      fail(error);
    } finally {
      working.current = false;
    }
  }

  function fail(error: unknown) {
    const extra = messageOf(error);
    const message = extra ? `${words.failed} ${extra}` : words.failed;
    setProblem(message);
    setSaid(message);
  }

  const hasActions = Boolean(onLessLikeThis || onHide || settingsHref);

  return (
    <div data-slot="recommendation-reason-panel" data-sponsored={sponsored ? "" : undefined} className={cn("relative flex min-w-0 flex-col text-sm text-popover-foreground", className)} {...props}>
      <div className={cn("px-4 pt-4", close ? "pr-12" : undefined)}>
        <h3 id={titleId ?? ownTitleId} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] text-balance">
          {title ?? words.title}
        </h3>
      </div>

      {sponsored ? (
        <div className="mx-4 mt-3 grid justify-items-start gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <Badge variant="outline" className="bg-background">
            <IconMegaphone />
            {words.sponsored}
          </Badge>
          <p className="font-medium text-pretty [overflow-wrap:anywhere]">{fill(words.paidBy, { by: sponsored.by })}</p>
          <p className="-mt-1 text-[0.8125rem] leading-relaxed text-pretty text-muted-foreground">{sponsored.note ?? words.sponsoredNote}</p>
        </div>
      ) : null}

      <div className="px-4 pt-4 pb-4">
        <h4 className="text-xs font-medium text-muted-foreground">{sponsored ? words.reasonsSponsored : words.reasons}</h4>
        {reasons.length ? (
          <ul className="mt-3 grid gap-3">
            {reasons.map((reason) => {
              // A kind that is not one of ours (data from elsewhere) is read as the page it is on, rather than taking the panel down.
              const kind: ReasonKind = reason.kind && reason.kind in KIND_ICON ? reason.kind : "context";
              const Icon = KIND_ICON[kind];
              return (
                <li key={`${kind}-${reason.label}`} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-3">
                  <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
                    <Icon />
                  </span>
                  <div className="min-w-0 pt-px">
                    <p className="leading-snug font-medium text-pretty [overflow-wrap:anywhere]">
                      <span className="sr-only">{kinds[kind]}: </span>
                      {reason.label}
                    </p>
                    {reason.detail ? <p className="mt-0.5 text-[0.8125rem] leading-snug text-pretty text-muted-foreground [overflow-wrap:anywhere]">{reason.detail}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 leading-snug text-pretty text-muted-foreground">{words.noReasons}</p>
        )}
      </div>

      {hasActions ? (
        <div className="grid gap-0.5 border-t border-border p-1.5">
          {onLessLikeThis ? (
            <ActionRow icon={<IconThumbsDown />} label={words.lessLikeThis} done={words.lessDone} phase={less} onPress={() => void run(onLessLikeThis, less, setLess, words.lessDone)} />
          ) : null}
          {onHide ? <ActionRow icon={<IconEyeOff />} label={words.hide} done={words.hideDone} phase={hidden} onPress={() => void run(onHide, hidden, setHidden, words.hideDone)} /> : null}
          {settingsHref ? (
            <a href={settingsHref} className={ROW}>
              <span aria-hidden="true" className="grid size-4 place-items-center text-muted-foreground">
                <IconSliders />
              </span>
              <span className="min-w-0 flex-1 leading-snug">{words.manage}</span>
              <IconChevronRight aria-hidden="true" className="text-muted-foreground transition-transform duration-150 group-hover/row:translate-x-0.5 motion-reduce:transition-none" />
            </a>
          ) : null}
          {problem ? (
            <p role="alert" className={cn("flex items-start gap-2 px-2 pt-1.5 pb-0.5 text-[0.8125rem] leading-snug", DANGER_TEXT)}>
              <IconAlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
              <span className="min-w-0">{problem}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {said}
      </p>
      {/* Last in the DOM, like the close button of a Dialog: the first Tab lands on the first action. Drawn first, in a frame with no height that sticks to the top of whatever scrolls, so a panel taller than the screen keeps its way out in view. */}
      {close ? (
        <div className="sticky top-0 z-10 order-first h-0">
          {/* The bigger button of a touch screen keeps the centre of the small one, so it never reaches down over what is under the title. */}
          <div className="absolute top-2.5 right-2.5 pointer-coarse:top-1.5 pointer-coarse:right-1.5">{close}</div>
        </div>
      ) : null}
    </div>
  );
}
