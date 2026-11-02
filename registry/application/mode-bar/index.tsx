import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { IconEye, IconFlask, IconLock, IconRocket } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The special mode: work on test data, acting as another person, looking without touching, or trying what is not final. */
export type ModeKind = "test" | "viewing-as" | "read-only" | "beta";

/** The words the bar uses, for translation. */
export interface ModeBarLabels {
  /** The word that names the mode, one per kind, so it reads without colour. Default "Test mode". */
  test?: string;
  /** Default "Viewing as". */
  viewingAs?: string;
  /** Default "Read only". */
  readOnly?: string;
  /** Default "Beta". */
  beta?: string;
  /** The button. Its name for a screen reader is this word, a colon and the mode: "Exit: Test mode". Default "Exit". */
  exit?: string;
}

export interface ModeBarProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Which mode this is. It decides the icon, the word and how loud the bar is. */
  kind: ModeKind;
  /** What comes after the mode's name: for "viewing-as", whose account it is ("Mara Jansen"). */
  title?: ReactNode;
  /** One plain statement of what is different: "No real payments are taken." Say what changes, not what the mode is called. */
  description?: ReactNode;
  /** Leaves the mode. The bar has no close button on purpose: a mode that can be hidden is how mistakes on real data happen, so it can only be left. Without `onExit` there is no button, for a mode the person cannot leave themselves. */
  onExit?: () => void;
  /** Pins the bar under the header while the page scrolls. It sticks at the top of its container; pass `className="top-14"` to sit under a 56px header. */
  sticky?: boolean;
  /** The words the bar uses, for translation. */
  labels?: ModeBarLabels;
}

const DEFAULT_LABELS = {
  test: "Test mode",
  viewingAs: "Viewing as",
  readOnly: "Read only",
  beta: "Beta",
  exit: "Exit",
} satisfies Required<ModeBarLabels>;

/**
 * Each kind has its own icon, its own word and its own weight, so the mode
 * reads without colour: test data is hatched, viewing as someone else is the
 * loudest bar because it is the riskiest, read only is plain, and beta is a
 * card with a hairline.
 */
const LOOK: Record<ModeKind, { icon: ReactNode; bar: string; chip: string; text: string; exit: string; style?: CSSProperties }> = {
  test: {
    icon: <IconFlask />,
    bar: "border-b border-border bg-muted text-foreground",
    chip: "border-foreground/25 bg-background text-foreground",
    text: "text-muted-foreground",
    exit: "border-border bg-background text-foreground hover:bg-background",
    style: { backgroundImage: "repeating-linear-gradient(135deg, color-mix(in oklch, var(--foreground) 6%, transparent) 0 8px, transparent 8px 16px)" },
  },
  "viewing-as": {
    icon: <IconEye />,
    bar: "bg-foreground text-background",
    chip: "border-background/30 bg-background/12 text-background",
    text: "text-background/80",
    // The bar is the colour of the focus ring, so on it the ring takes the opposite token: a halo of the page background.
    exit: "border-transparent bg-background text-foreground hover:bg-background/90 focus-visible:border-background focus-visible:ring-background/70",
  },
  "read-only": {
    icon: <IconLock />,
    bar: "border-b border-border bg-muted text-foreground",
    chip: "border-border bg-background text-foreground",
    text: "text-muted-foreground",
    exit: "border-border bg-background text-foreground hover:bg-background",
  },
  beta: {
    icon: <IconRocket />,
    bar: "border-b border-border bg-card text-card-foreground",
    chip: "border-border bg-muted text-foreground",
    text: "text-muted-foreground",
    exit: "border-border bg-background text-foreground hover:bg-muted",
  },
};

/**
 * A bar that says you are in a special mode (test data, viewing as someone
 * else, read only, beta) and gives the way out. One row: an icon and the mode's
 * name, a plain statement of what is different, and a single Exit button. It
 * cannot be dismissed, only exited, because a hidden mode is how mistakes on
 * real data happen. Every kind has its own icon, word and weight, so the mode
 * reads without colour. It is a labelled region that screen reader users can
 * jump to, and `sticky` keeps it in view while the page scrolls.
 */
export function ModeBar({ kind, title, description, onExit, sticky = false, labels, className, style, ...props }: ModeBarProps) {
  const text: Required<ModeBarLabels> = { ...DEFAULT_LABELS, ...labels };
  const look = LOOK[kind];
  const name = { test: text.test, "viewing-as": text.viewingAs, "read-only": text.readOnly, beta: text.beta }[kind];
  // The region is named by the mode, and for "viewing as" by whose account it is when that is plain text.
  const regionName = typeof title === "string" ? `${name} ${title}` : name;

  return (
    <section
      data-slot="mode-bar"
      data-kind={kind}
      aria-label={regionName}
      className={cn("@container w-full", sticky && "sticky top-0 z-30", look.bar, className)}
      style={{ ...look.style, ...style }}
      {...props}
    >
      {/* A narrow bar has the mode and the way out on one line and the statement under them; a wide one puts the statement between the two. */}
      <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-2 sm:px-6 @2xl:grid-cols-[auto_minmax(0,1fr)_auto] @2xl:gap-x-4">
        <div className="col-start-1 row-start-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs leading-none font-semibold tracking-[0.02em] whitespace-nowrap [&_svg]:size-3.5", look.chip)}>
            {look.icon}
            {name}
          </span>
          {title ? <span className="min-w-0 text-sm leading-5 font-semibold [overflow-wrap:anywhere]">{title}</span> : null}
        </div>
        {description ? <p className={cn("col-span-2 row-start-2 min-w-0 text-sm leading-5 @2xl:col-span-1 @2xl:col-start-2 @2xl:row-start-1", look.text)}>{description}</p> : null}
        {onExit ? (
          <Button type="button" size="sm" variant="outline" aria-label={`${text.exit}: ${regionName}`} onClick={onExit} className={cn("col-start-2 row-start-1 shrink-0 @2xl:col-start-3", look.exit)}>
            {text.exit}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
