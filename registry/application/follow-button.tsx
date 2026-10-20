"use client";

import { useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconClock, IconClose, IconUserCheck, IconUserMinus, IconUserPlus } from "@rhs-ui/icons";
import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type FollowStatus = "none" | "following" | "requested";

export interface FollowButtonProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** Where things stand: not following, following, or waiting for the person to approve. Controlled: update it, and `count`, in your callbacks before they resolve. */
  status?: FollowStatus;
  /** Where an uncontrolled button starts. Default "none". */
  defaultStatus?: FollowStatus;
  /**
   * Called when Follow is pressed. The button changes at once; if this rejects, it rolls back and says so.
   * Resolve with "requested" when the account turned out to need approval.
   */
  onFollow?: () => FollowStatus | void | Promise<FollowStatus | void>;
  /** Called when Following (or Requested) is pressed again. Same rules: at once, then settle or roll back. */
  onUnfollow?: () => void | Promise<void>;
  /** How many people follow. It moves with the button, and counts up or down. Leave it out to show no count. */
  count?: number;
  /** Who or what is followed, for the accessible name: "Maya Okafor" gives "Follow Maya Okafor". */
  name: string;
  /** A private account: following asks for approval ("Requested"), and unfollowing asks once to confirm. */
  isPrivate?: boolean;
  /** What the count counts, singular and plural. Default follower and followers. */
  noun?: readonly [singular: string, plural: string];
  /** Language of the numbers. Default "en-US". */
  locale?: string;
  /** The look of the Follow button; once following it turns into an outline. Default "default". */
  variant?: "default" | "secondary" | "outline";
  /** Any Button size. */
  size?: "sm" | "default" | "lg";
}

const LOOK = {
  none: { label: "Follow", alt: null, icon: <IconUserPlus />, altIcon: null },
  following: { label: "Following", alt: "Unfollow", icon: <IconUserCheck />, altIcon: <IconUserMinus /> },
  requested: { label: "Requested", alt: "Cancel", icon: <IconClock />, altIcon: <IconClose /> },
} as const;

// Followers are whole people: without this the count shows decimals while it counts.
const COUNT_FORMAT = { maximumFractionDigits: 0 } as const;
const COUNT_SIZE = { sm: "px-2.5 text-[0.8125rem]", default: "px-3 text-sm", lg: "px-4 text-[0.9375rem]" } as const;
const fade = "col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none";

/**
 * A button for following people, topics or projects. It answers at once and
 * settles afterwards: pressing Follow shows Following (and one more follower)
 * right away, and if the request fails it rolls back with a short line saying
 * so. Hovering or focusing Following shows the unfollow action, but the pressed
 * state only ever changes when the button is pressed, and a press is ignored
 * while a request is on its way. A private account shows Requested and asks
 * for one confirmation before unfollowing. The count uses tabular numbers that
 * count up and down, and a polite announcement says the result, "Following Maya
 * Okafor, 1,204 followers".
 */
export function FollowButton({
  status,
  defaultStatus = "none",
  onFollow,
  onUnfollow,
  count,
  name,
  isPrivate = false,
  noun = ["follower", "followers"],
  locale = "en-US",
  variant = "default",
  size = "default",
  className,
  ...props
}: FollowButtonProps) {
  const describedBy = useId();
  const button = useRef<HTMLButtonElement>(null);
  const [own, setOwn] = useState<FollowStatus>(defaultStatus);
  const [optimistic, setOptimistic] = useState<FollowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Right after a press the label keeps saying where things stand; the unfollow action shows on the next hover or focus.
  const [fresh, setFresh] = useState(false);
  const pending = useRef(false);

  const settled = status ?? own;
  const shown = optimistic ?? settled;
  const busy = optimistic !== null;
  const look = LOOK[shown];
  const showAlt = look.alt !== null && (hovered || focused) && !fresh && !busy;
  const asksFirst = isPrivate && shown === "following";

  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const followers = (value: number) => `${numbers.format(value)} ${noun[plural.select(value) === "one" ? 0 : 1]}`;
  // The count moves with the button: one more while following. The count passed in already includes the settled status when the
  // button is controlled; when it is not, the count was written for the status it started with and does not move by itself.
  const reference = status !== undefined ? settled : defaultStatus;
  const countFor = (state: FollowStatus) => (count === undefined ? undefined : Math.max(0, count + (state === "following" ? 1 : 0) - (reference === "following" ? 1 : 0)));
  const shownCount = countFor(shown);
  const tail = (value: number | undefined) => (value === undefined ? "" : `, ${followers(value)}`);
  const sentence = (state: FollowStatus, value: number | undefined) =>
    state === "following" ? `Following ${name}${tail(value)}` : state === "requested" ? `Follow request sent to ${name}. Waiting for approval${tail(value)}` : `Not following ${name}${tail(value)}`;

  async function press(): Promise<void> {
    if (pending.current) return;
    const from = shown;
    const next: FollowStatus = from === "none" ? (isPrivate ? "requested" : "following") : "none";
    pending.current = true;
    setError(null);
    setFresh(true);
    setOptimistic(next);
    try {
      let result: FollowStatus = next;
      if (from === "none") {
        const answer = await onFollow?.();
        if (answer === "following" || answer === "requested") result = answer;
      } else {
        await onUnfollow?.();
      }
      if (status === undefined) setOwn(result);
      const after = countFor(result);
      setAnnouncement(result !== "none" ? sentence(result, after) : from === "requested" ? `Follow request to ${name} cancelled${tail(after)}` : `Unfollowed ${name}${tail(after)}`);
    } catch {
      setError(from === "none" ? `Could not follow ${name}. Try again.` : from === "requested" ? `Could not cancel the request to ${name}. Try again.` : `Could not unfollow ${name}. Try again.`);
      setAnnouncement("");
    } finally {
      pending.current = false;
      setOptimistic(null);
    }
  }

  async function confirm(): Promise<void> {
    setConfirming(false);
    await press();
  }

  return (
    <div data-slot="follow-button" className={cn("inline-flex max-w-full flex-col items-start gap-1.5", className)} {...props}>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      <span id={describedBy} className="sr-only">
        {sentence(shown, shownCount)}
      </span>
      <div className="inline-flex items-stretch">
        <Popover open={confirming} onOpenChange={setConfirming}>
          <PopoverAnchor asChild>
            <Button
              ref={button}
              type="button"
              variant={shown === "none" ? variant : variant === "outline" ? "secondary" : "outline"}
              size={size}
              aria-label={`Follow ${name}`}
              aria-pressed={shown !== "none"}
              aria-describedby={describedBy}
              aria-haspopup={asksFirst ? "dialog" : undefined}
              aria-expanded={asksFirst ? confirming : undefined}
              aria-busy={busy || undefined}
              data-status={shown}
              data-alt={showAlt || undefined}
              onClick={() => (asksFirst && !busy ? setConfirming(true) : void press())}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHovered(true);
              }}
              onPointerLeave={() => {
                setHovered(false);
                setFresh(false);
              }}
              onFocus={(event) => setFocused(event.currentTarget.matches(":focus-visible"))}
              onBlur={() => {
                setFocused(false);
                if (!hovered) setFresh(false);
              }}
              // The unfollow action is tinted toward the destructive colour, darkened a little so it still reads on the hover background.
              className={cn(shownCount !== undefined && "rounded-r-none", "data-[alt=true]:border-destructive/40 data-[alt=true]:text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]")}
            >
              <span className="relative grid size-4 shrink-0 place-items-center">
                <span key={`${shown}-icon`} className={cn(fade, "starting:opacity-0", showAlt ? "opacity-0" : "opacity-100")}>
                  {look.icon}
                </span>
                {look.altIcon ? <span className={cn(fade, showAlt ? "opacity-100" : "opacity-0")}>{look.altIcon}</span> : null}
              </span>
              <span className="inline-grid">
                <span key={shown} aria-hidden="true" className={cn(fade, "starting:opacity-0", showAlt ? "opacity-0" : "opacity-100")}>
                  {look.label}
                </span>
                {look.alt ? (
                  <span aria-hidden="true" className={cn(fade, showAlt ? "opacity-100" : "opacity-0")}>
                    {look.alt}
                  </span>
                ) : null}
              </span>
            </Button>
          </PopoverAnchor>
          <PopoverContent
            role="alertdialog"
            aria-label={`Unfollow ${name}?`}
            align="start"
            className="w-72"
            // There is no PopoverTrigger to return focus to, so the button gets it back.
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              button.current?.focus();
            }}
          >
            <p className="text-sm font-medium">Unfollow {name}?</p>
            <p className="mt-1 text-sm text-muted-foreground">{name} is private. You would have to send a new request to follow again.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" autoFocus onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={() => void confirm()}>
                Unfollow
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {shownCount !== undefined ? (
          <span
            data-slot="follow-count"
            aria-hidden="true"
            className={cn("inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted/50 font-medium text-foreground", COUNT_SIZE[size])}
          >
            <AnimatedNumber value={shownCount} locale={locale} format={COUNT_FORMAT} duration={0.5} />
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <IconAlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
