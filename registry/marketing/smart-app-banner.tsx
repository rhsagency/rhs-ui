"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Rating } from "@rhs-ui/primitives/rating";
import { cn } from "@/lib/utils";

export interface SmartAppBannerLabels {
  /** The name of the region, for a screen reader. */
  banner: string;
  /** The button when the app is not installed. */
  get: string;
  /** The button when it is. */
  open: string;
  /** The name of the close button. */
  dismiss: string;
  /** The rating in words, for a screen reader. {rating} is the score, {count} the number of reviews. */
  rated: string;
}

export interface SmartAppBannerProps extends Omit<ComponentProps<"section">, "children" | "onChange"> {
  /** The name of the app. */
  name: string;
  /** One line about it: "Offline maps and trip notes". */
  pitch?: string;
  /** Your app icon, as an img or an svg. Left out, a monogram of the name is drawn. */
  icon?: ReactNode;
  /** The score out of 5. Left out, the rating line is not shown. */
  rating?: number;
  /** How many reviews it is from. */
  ratingCount?: number;
  /** Whether the app is on this device: the button then reads Open and goes to openHref. You find that out; a browser cannot tell you. */
  installed?: boolean;
  /** The store page. The Get button goes here. */
  storeHref: string;
  /** A deep link into the app, such as "atlas://home". The Open button goes here; without it Open falls back to storeHref. */
  openHref?: string;
  /** Called with "get" or "open" as the button is followed. */
  onAction?: (action: "get" | "open") => void;
  /** Called when the banner is closed. Store the choice and keep it away for thirty days: it is yours to remember. */
  onDismiss?: () => void;
  /** Where it shows: on "phones" (below 640px, the default), on "tablets" too (below 1024px) or on "all" screens. */
  showOn?: "phones" | "tablets" | "all";
  /** The page edge it sits on: it picks the border side and pads the banner for the notch at the top or the home indicator at the bottom. You place the banner yourself. */
  position?: "top" | "bottom";
  /** The language the score and the review count are written in. */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<SmartAppBannerLabels>;
}

const LABELS: SmartAppBannerLabels = { banner: "Get the app", get: "Get", open: "Open", dismiss: "Close", rated: "Rated {rating} out of 5 from {count} reviews" };

/* Every class is written out in full, because Tailwind only generates what it can read in the source. */
const SHOW = { phones: "sm:hidden", tablets: "lg:hidden", all: "" } as const;

/**
 * A smart banner for phones that points to your app in a store: its icon, its
 * name and a line about it, a star rating with the count of reviews, one
 * button that reads Get or Open depending on whether the app is installed, and
 * a close. It is for apps that live in a store, with a link to the store page,
 * and not for installing a web app, which is a different prompt. It shows on
 * phones only by default, and it is padded for the notch and the home
 * indicator when the page uses viewport-fit=cover. Closing hands the choice
 * back to you, so you can keep it away for thirty days. The rating is words as
 * well as stars: "Rated 4.8 out of 5 from 12,400 reviews".
 */
export function SmartAppBanner({
  name,
  pitch,
  icon,
  rating,
  ratingCount,
  installed = false,
  storeHref,
  openHref,
  onAction,
  onDismiss,
  showOn = "phones",
  position = "top",
  locale = "en-US",
  labels: custom,
  className,
  ...props
}: SmartAppBannerProps) {
  const words = { ...LABELS, ...custom };
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const score = rating === undefined ? undefined : new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rating);
  const reviews = ratingCount === undefined ? undefined : new Intl.NumberFormat(locale).format(ratingCount);
  const verb = installed ? words.open : words.get;

  return (
    <section
      data-slot="smart-app-banner"
      aria-label={words.banner}
      className={cn("border-border bg-background text-foreground", position === "top" ? "border-b pt-[env(safe-area-inset-top)]" : "border-t pb-[env(safe-area-inset-bottom)]", SHOW[showOn], className)}
      {...props}
    >
      <div className="flex items-center gap-2.5 py-2.5 pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.25rem,env(safe-area-inset-left))]">
        <button
          type="button"
          aria-label={words.dismiss}
          onClick={() => {
            setOpen(false);
            onDismiss?.();
          }}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          <IconClose aria-hidden="true" className="size-4" />
        </button>

        <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-border [&>*]:size-full [&>img]:object-cover">
          {icon ?? (
            <span aria-hidden="true" className="grid place-items-center bg-foreground text-xl font-semibold text-background">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{name}</p>
          {pitch ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{pitch}</p> : null}
          {score ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className="inline-flex">
                <Rating readOnly value={rating} size={12} />
              </span>
              <span aria-hidden="true" className="tabular-nums">
                {score}
                {reviews ? ` (${reviews})` : ""}
              </span>
              <span className="sr-only">{words.rated.replace("{rating}", score).replace("{count}", reviews ?? "")}</span>
            </p>
          ) : null}
        </div>

        <Button asChild size="sm" className="shrink-0 rounded-full px-3.5 font-semibold">
          <a href={installed ? (openHref ?? storeHref) : storeHref} aria-label={`${verb} ${name}`} onClick={() => onAction?.(installed ? "open" : "get")}>
            {verb}
          </a>
        </Button>
      </div>
    </section>
  );
}
