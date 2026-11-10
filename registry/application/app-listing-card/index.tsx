"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent } from "react";

import { countText, fill, percentText, scoreText, sizeText, versionText } from "@rhs-ui/application/app-listing-card/format";
import { RatingInline } from "@rhs-ui/commerce/rating-inline";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** Where the app stands on this device: not here yet, on its way, here, or here with a newer version waiting. */
export type AppListingState = "get" | "installing" | "installed" | "update";

/** The words the card uses, for translation. `{name}` and `{rating}` and `{count}` are filled in. */
export interface AppListingCardLabels {
  /** Said to screen readers before the developer. Default "Developer". */
  developer?: string;
  /** Said to screen readers before the category. Default "Category". */
  category?: string;
  /** Said to screen readers before the download size. Default "Size". */
  size?: string;
  /** Said to screen readers before the version. Default "Version". */
  version?: string;
  /** The button of an app that is not installed. Default "Get". */
  get?: string;
  /** The name of that button. Default "Get {name}". */
  getFor?: string;
  /** The button of an app that is installed. Default "Open". */
  open?: string;
  /** The name of that button. Default "Open {name}". */
  openFor?: string;
  /** The button of an app with a newer version. Default "Update". */
  update?: string;
  /** The name of that button. Default "Update {name}". */
  updateFor?: string;
  /** The word on the button while the app installs, with the percentage after it. Default "Installing". */
  installing?: string;
  /** The name of the button while the app installs, and of the progress bar along its foot. Default "Installing {name}". */
  progress?: string;
  /** What a screen reader hears for the stars when there is no count. Default "Rated {rating} out of 5". */
  rated?: string;
  /** What a screen reader hears for the stars, with the count. Default "Rated {rating} from {count} ratings". */
  ratedCount?: string;
  /** The same for exactly one rating. Default "Rated {rating} from 1 rating". */
  ratedOne?: string;
  /** Said politely when an install starts. Default "Installing {name}…". */
  installingSaid?: string;
  /** Said politely when an update starts. Default "Updating {name}…". */
  updatingSaid?: string;
  /** Said politely when the install is done. Default "{name} installed. You can open it now.". */
  installedSaid?: string;
  /** Said politely when the update is done. Default "{name} updated.". */
  updatedSaid?: string;
  /** Said politely when a newer version turns up. Default "An update for {name} is available.". */
  updateSaid?: string;
  /** Said politely when the app is gone from this device. Default "{name} removed.". */
  removedSaid?: string;
}

export interface AppListingCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The app's name: "Pocketwise". It is the one link of the card. */
  name: string;
  /** The icon, as an image address. Without one, or while it loads, the tile shows the initials of the name. */
  icon?: string;
  /** Who made it: "Halcyon Labs". */
  developer?: string;
  /** What it is: "Finance". */
  category?: string;
  /** The average rating, 0 to 5, drawn as stars with the score and a short count; a screen reader hears "Rated 4.7 from 12,400 ratings". */
  rating?: number;
  /** How many ratings the score rests on. */
  ratingCount?: number;
  /** The size of the download: a number of bytes (written "48 MB") or your own words. */
  size?: number | string;
  /** The version: "3.2.1" is written "v3.2.1". */
  version?: string;
  /** Where the app stands. The action follows it: Get, an Installing progress, Open or Update. Default "get". */
  state?: AppListingState;
  /** How far along the install is, 0 to 100, written as a percentage. Leave it out for an install whose length is not known. */
  progress?: number;
  /** The action was pressed, with the state the app was in: "get" asked to install, "installed" asked to open, "update" asked to update. There is no action while it is installing. */
  onAction?: (state: AppListingState) => void;
  /** The app's page. The name becomes a link and the whole card opens it. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the name becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words the card uses, for translation. */
  labels?: AppListingCardLabels;
}

const DEFAULT_LABELS = {
  developer: "Developer",
  category: "Category",
  size: "Size",
  version: "Version",
  get: "Get",
  getFor: "Get {name}",
  open: "Open",
  openFor: "Open {name}",
  update: "Update",
  updateFor: "Update {name}",
  installing: "Installing",
  progress: "Installing {name}",
  rated: "Rated {rating} out of 5",
  ratedCount: "Rated {rating} from {count} ratings",
  ratedOne: "Rated {rating} from 1 rating",
  installingSaid: "Installing {name}…",
  updatingSaid: "Updating {name}…",
  installedSaid: "{name} installed. You can open it now.",
  updatedSaid: "{name} updated.",
  updateSaid: "An update for {name} is available.",
  removedSaid: "{name} removed.",
};

/**
 * The rating line: stars drawn to the exact average and the score, then the
 * count written in full ("1,284"), not shortened ("1.3k"). A shortened number
 * is written differently by Node and by the browser in some languages, and
 * the server and the browser have to agree. A screen reader hears `label`
 * for all of it, so the count is hidden from it.
 */
function Score({ value, count, label, locale, size, emptyText, className }: { value: number; count?: number; label?: string; locale: string; size: "sm" | "md"; emptyText?: string; className?: string }) {
  return (
    <span className={cn("inline-flex max-w-full flex-wrap items-center gap-y-0.5", size === "sm" ? "gap-x-1 text-xs" : "gap-x-1.5 text-sm", className)}>
      <RatingInline value={value} count={count} hideCount size={size} label={label} locale={locale} emptyText={emptyText} />
      {count !== undefined && count > 0 ? (
        <span aria-hidden="true" className="leading-none text-muted-foreground tabular-nums">
          ({countText(count, locale)})
        </span>
      ) : null}
    </span>
  );
}

/** What stretches the name's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * An app in a directory, a store or a plugin gallery: its icon as a rounded
 * square (initials while the picture loads or when there is none), the name as
 * the one link of the card, who made it and what it is, the rating drawn to
 * the exact average, and the size and version in a muted line. The action
 * follows the state: Get, Installing with its percentage and a progress bar
 * along its foot, Open, or Update. It is one button for the whole life of the
 * action (busy and inert while the app installs, not removed), so the focus
 * that was on Get is still on it when it becomes Open. Each change of state is
 * announced politely, without reading out every percent. The action is its
 * own target above the card's link, so pressing it never opens the page.
 */
export function AppListingCard({
  name,
  icon,
  developer,
  category,
  rating,
  ratingCount,
  size,
  version,
  state = "get",
  progress,
  onAction,
  href,
  onOpen,
  headingLevel = 3,
  locale = "en-US",
  labels,
  className,
  ...props
}: AppListingCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const nameId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const previous = useRef(state);
  const updating = useRef(false);
  const [said, setSaid] = useState("");

  // A change of state is said once, politely. The percentage is not: a bar that ticks would talk all the way through.
  useEffect(() => {
    const was = previous.current;
    previous.current = state;
    if (was === state) return;
    if (state === "installing") {
      updating.current = was === "update";
      setSaid(fill(updating.current ? text.updatingSaid : text.installingSaid, { name }));
    } else if (state === "installed") {
      setSaid(fill(was === "installing" && updating.current ? text.updatedSaid : text.installedSaid, { name }));
      updating.current = false;
    } else if (state === "update") {
      setSaid(fill(text.updateSaid, { name }));
    } else {
      setSaid(fill(text.removedSaid, { name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a change of state is announced, not a change of words
  }, [state]);

  const installing = state === "installing";
  const known = typeof progress === "number" && Number.isFinite(progress);
  const percent = known ? Math.min(100, Math.max(0, progress)) : 0;
  const sizeValue = typeof size === "number" ? sizeText(size, locale) : size;
  const versionValue = version ? versionText(version) : null;
  const stars =
    rating === undefined
      ? undefined
      : ratingCount === undefined
        ? fill(text.rated, { rating: scoreText(rating, locale) })
        : fill(ratingCount === 1 ? text.ratedOne : text.ratedCount, { rating: scoreText(rating, locale), count: countText(ratingCount, locale) });

  const label = <span className="[overflow-wrap:anywhere]">{name}</span>;

  return (
    <article
      data-slot="app-listing-card"
      data-state={state}
      aria-labelledby={nameId}
      className={cn(
        "group/app-listing-card @container relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=app-listing-card-open]:focus-visible]:border-ring has-[[data-slot=app-listing-card-open]:focus-visible]:ring-[3px] has-[[data-slot=app-listing-card-open]:focus-visible]:ring-ring/40",
        "@sm:grid-cols-[auto_minmax(0,1fr)_auto]",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <Avatar className="size-14 rounded-[22%] border border-border bg-muted shadow-xs data-[size=default]:size-14">
        {icon ? <AvatarImage src={icon} alt="" className="rounded-none" /> : null}
        <AvatarFallback className="rounded-none text-xl font-semibold tracking-[-0.02em] text-foreground">{initialsOf(name).slice(0, 2) || "?"}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <Heading id={nameId} className="text-[0.9375rem] leading-6 font-semibold tracking-[-0.01em]">
          {href ? (
            <a data-slot="app-listing-card-open" href={href} onClick={onOpen} className={cn(OPEN, "block truncate")}>
              {label}
            </a>
          ) : onOpen ? (
            <button data-slot="app-listing-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer truncate text-start")}>
              {label}
            </button>
          ) : (
            <span className="block truncate">{label}</span>
          )}
        </Heading>

        {developer || category ? (
          <p className="relative truncate text-sm leading-5 text-muted-foreground">
            {developer ? (
              <>
                <span className="sr-only">{text.developer}: </span>
                {developer}
              </>
            ) : null}
            {developer && category ? <span aria-hidden="true" className="mx-1.5">·</span> : null}
            {category ? (
              <>
                <span className="sr-only">
                  {developer ? ", " : ""}
                  {text.category}:{" "}
                </span>
                {category}
              </>
            ) : null}
          </p>
        ) : null}

        {rating !== undefined || sizeValue || versionValue ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] leading-5 text-muted-foreground">
            {rating !== undefined ? <Score value={rating} count={ratingCount} size="sm" label={stars} locale={locale} className="shrink-0 whitespace-nowrap" /> : null}
            {sizeValue || versionValue ? (
              <dl className="flex items-center gap-x-2 tabular-nums">
                {sizeValue ? (
                  <div>
                    <dt className="sr-only">{text.size}</dt>
                    <dd className="whitespace-nowrap">{sizeValue}</dd>
                  </div>
                ) : null}
                {sizeValue && versionValue ? <span aria-hidden="true">·</span> : null}
                {versionValue ? (
                  <div>
                    <dt className="sr-only">{text.version}</dt>
                    <dd>{versionValue}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>
        ) : null}
      </div>

      {/*
        Beside the text when the card is wide enough, under it when it is not, so the text never gets squeezed to a few words.
        One button for the whole life of the action: while the app installs it stays, busy and inert, with the progress along its
        foot, so a keyboard or a screen reader never loses its place, and when the install is done it simply becomes Open.
      */}
      <div className="relative z-10 col-start-2 justify-self-start @sm:col-start-3 @sm:justify-self-end">
        <Button
          type="button"
          size="sm"
          variant={state === "get" || state === "update" ? "default" : "outline"}
          // While it installs, the name starts with what the button shows ("Installing 42%"), then the app (WCAG 2.5.3).
          aria-label={installing && known ? `${text.installing} ${percentText(percent / 100, locale)}, ${name}` : fill(installing ? text.progress : state === "installed" ? text.openFor : state === "update" ? text.updateFor : text.getFor, { name })}
          // Not `disabled`: a disabled button drops the focus it has.
          aria-disabled={installing || undefined}
          aria-busy={installing || undefined}
          onClick={() => {
            if (!installing) onAction?.(state);
          }}
          className={cn("min-w-16", installing && "pb-1 tabular-nums aria-disabled:hover:border-border aria-disabled:hover:bg-background active:not-disabled:translate-none")}
        >
          {installing ? (
            <>
              {/* Beside the text there is only room for the number, as wide as Get was, so the text does not move when the install starts; the word is still its name. */}
              <span className={cn(known && "@sm:sr-only")}>{text.installing}</span>
              {known ? (
                <>
                  {" "}
                  <span className="font-semibold">{percentText(percent / 100, locale)}</span>
                </>
              ) : null}
            </>
          ) : state === "installed" ? (
            text.open
          ) : state === "update" ? (
            text.update
          ) : (
            text.get
          )}
        </Button>
        {installing ? (
          <Progress
            value={known ? percent : undefined}
            aria-label={fill(text.progress, { name })}
            getValueLabel={known ? () => percentText(percent / 100, locale) : undefined}
            className="pointer-events-none absolute inset-x-2 bottom-1 h-[3px] w-auto"
          />
        ) : null}
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>
    </article>
  );
}
