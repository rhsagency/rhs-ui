"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

import { IconLock } from "@rhs-ui/icons";
import { Card } from "@rhs-ui/primitives/card";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface ActionTile {
  /** Stable identity; the label when left out. */
  id?: string;
  /** What it does in a word or two: "New invoice". */
  label: string;
  /** One line on what it does. Left out in dense mode. */
  description?: string;
  /** An icon element, drawn at 18px: `<IconFilePlus />`. */
  icon?: ReactNode;
  /** Makes the tile a link. */
  href?: string;
  /** Makes the tile a button, called when it is pressed. A tile with an `href` is a link and calls it too, for tracking. */
  onSelect?: () => void;
  /** A hint for the keys, "N then I" or "⌘K". It only shows the keys: bind them yourself. */
  shortcut?: string;
  /** Does nothing when pressed but stays in the tab order. Give it a `disabledReason`. */
  disabled?: boolean;
  /** Why it is disabled. Shown in a tooltip, in place of the description on a full-size tile (and under the label of a dense one on a touch screen), and read out with the tile. */
  disabledReason?: string;
}

export interface ActionTilesProps extends Omit<ComponentProps<"div">, "children"> {
  /** The tiles, in reading order. */
  actions: readonly ActionTile[];
  /** Columns when there is room. The grid folds to two columns on a phone. */
  columns?: 2 | 3 | 4;
  /** Tighter tiles: the icon beside the label, no description. */
  dense?: boolean;
  /** What the group is called for screen readers. */
  label?: string;
}

/** Comfortable tiles keep two columns on a phone; dense tiles are rows, so they take the whole width there. */
const COLUMNS = {
  comfortable: { 2: "grid-cols-2", 3: "grid-cols-2 @lg:grid-cols-3", 4: "grid-cols-2 @xl:grid-cols-4" },
  dense: { 2: "grid-cols-1 @sm:grid-cols-2", 3: "grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3", 4: "grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4" },
} as const;

/** The keys are a hint for a keyboard: they hide on touch screens, and when the tile is too narrow to spare the room, so a label is never cut short for them. */
function Shortcut({ keys, dense }: { keys: string; dense: boolean }) {
  return (
    <KbdGroup className={cn("hidden shrink-0", dense ? "[@media(hover:hover)]:@min-[17rem]/tile:inline-flex" : "[@media(hover:hover)]:@min-[9rem]/tile:inline-flex")}>
      <span className="sr-only">Shortcut: </span>
      {keys
        .split(/\s+/)
        .filter(Boolean)
        .map((token, index) =>
          token.toLowerCase() === "then" ? (
            <span key={index} className="text-[0.6875rem] text-muted-foreground">
              then
            </span>
          ) : (
            <Kbd key={index}>{token}</Kbd>
          ),
        )}
    </KbdGroup>
  );
}

function Tile({ action, dense }: { action: ActionTile; dense: boolean }) {
  const reasonId = useId();
  const disabled = Boolean(action.disabled);
  // A tooltip alone leaves touch screens guessing, so a roomy tile also says why in place of its description.
  // A dense tile has no description to replace: its reason goes to the tooltip and to screen readers, and on a touch screen under the label.
  const reasonShown = disabled && !dense && Boolean(action.disabledReason);

  const icon = action.icon ? (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center border border-border bg-background [&_svg]:size-[18px]",
        dense ? "size-8 rounded-md" : "size-10 rounded-lg",
        disabled ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {action.icon}
    </span>
  ) : null;
  const hint = disabled ? <IconLock size={14} aria-hidden="true" className="shrink-0 text-muted-foreground" /> : action.shortcut ? <Shortcut keys={action.shortcut} dense={dense} /> : null;
  const body = dense ? (
    <span className="flex w-full items-center gap-3">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{action.label}</span>
        {/* A touch screen has no hover for the tooltip, so there the reason is written under the label. A screen reader already has it through aria-describedby. */}
        {disabled && action.disabledReason ? (
          <span aria-hidden="true" className="hidden text-xs leading-snug text-muted-foreground [@media(hover:none)]:block">
            {action.disabledReason}
          </span>
        ) : null}
      </span>
      {hint}
    </span>
  ) : (
    // The label comes before the keys in the document, so it is also what a screen reader hears first; the grid puts the keys back at the top right.
    // The text hangs from the icon, so labels line up across a row and the spare height of a shorter tile falls under its description.
    <span className="grid w-full flex-1 grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_1fr] gap-x-3 gap-y-4">
      {icon}
      <span className="col-span-2 row-start-2 grid gap-0.5 self-start">
        <span className="text-sm leading-snug font-medium">{action.label}</span>
        {reasonShown ? (
          <span className="text-xs leading-snug text-muted-foreground">{action.disabledReason}</span>
        ) : action.description ? (
          <span className="text-xs leading-snug text-muted-foreground">{action.description}</span>
        ) : null}
      </span>
      {hint ? <span className="col-start-2 row-start-1 justify-self-end">{hint}</span> : null}
    </span>
  );
  // The card is a column and the grid stretches it to the tallest tile of the row, so the control takes all the height: hover fills the card and every pixel of it presses.
  const face = cn(
    "flex w-full flex-1 text-left outline-none transition-colors duration-150 motion-reduce:transition-none",
    dense ? "min-h-11 items-center px-3 py-2" : "min-h-[7.5rem] p-4",
  );

  let control: ReactNode;
  if (disabled) {
    control = (
      <button type="button" aria-disabled="true" aria-describedby={action.disabledReason && !reasonShown ? reasonId : undefined} onClick={(event) => event.preventDefault()} className={cn(face, "cursor-not-allowed text-muted-foreground")}>
        {body}
      </button>
    );
  } else if (action.href) {
    control = (
      <a href={action.href} onClick={action.onSelect} className={cn(face, "hover:bg-muted/50 active:bg-muted")}>
        {body}
      </a>
    );
  } else {
    control = (
      <button type="button" onClick={action.onSelect} className={cn(face, "hover:bg-muted/50 active:bg-muted")}>
        {body}
      </button>
    );
  }

  return (
    <Card
      data-disabled={disabled || undefined}
      className="@container/tile relative h-full gap-0 overflow-hidden py-0 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 motion-reduce:transition-none"
    >
      {disabled && action.disabledReason ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>{control}</TooltipTrigger>
            <TooltipContent>{action.disabledReason}</TooltipContent>
          </Tooltip>
          {reasonShown ? null : (
            <span id={reasonId} className="sr-only">
              Unavailable: {action.disabledReason}
            </span>
          )}
        </>
      ) : (
        control
      )}
    </Card>
  );
}

/**
 * The things people do most, one press away on a dashboard home: a grid of
 * tiles with an icon, a short label, an optional line of description and the
 * shortcut keys as a hint. Each tile is a real link or button with a 44px
 * minimum target and a visible focus ring. A disabled tile stays in the tab
 * order (aria-disabled), does nothing when pressed and says why: in a tooltip,
 * to screen readers and, because touch screens have no hover, in place of its
 * description (or under the label of a dense tile). The grid folds from four
 * columns to two.
 */
export function ActionTiles({ actions, columns = 4, dense = false, label = "Quick actions", className, ...props }: ActionTilesProps) {
  return (
    <TooltipProvider>
      <div data-slot="action-tiles" data-dense={dense || undefined} className={cn("@container w-full", className)} {...props}>
        <ul role="list" aria-label={label} className={cn("grid gap-3", COLUMNS[dense ? "dense" : "comfortable"][columns])}>
          {actions.map((action) => (
            <li key={action.id ?? action.label}>
              <Tile action={action} dense={dense} />
            </li>
          ))}
        </ul>
      </div>
    </TooltipProvider>
  );
}
