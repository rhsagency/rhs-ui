"use client";

import { Fragment, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconArrowUpRight, IconClose, IconHelp } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

/** One entry of the help menu: a link or an action, with an optional line of explanation and a shortcut hint. */
export interface HelpLauncherItem {
  /** A stable identity. */
  id: string;
  /** What the entry is called: "Search the docs", "Chat with us". */
  label: string;
  /** A second line under the label: what you get, how long it takes, or the current status. */
  description?: string;
  /** An icon element, drawn at 16px in a quiet tile. */
  icon?: ReactNode;
  /** A page to open. An address that starts with http opens in a new tab and shows an arrow; anything else opens in place. */
  href?: string;
  /** An action instead of a page: open a dialog, start a chat. Choosing the entry closes the menu first. */
  onSelect?: () => void;
  /** Keys shown at the end of the row, as `"?"`, `["Ctrl", "K"]` or `"Ctrl K"`. Display only: bind the key yourself. */
  shortcut?: string | readonly string[];
  /** Entries with the same group sit together; a rule separates one group from the next. */
  group?: string;
  /** Greyed out and skipped by the keyboard. */
  disabled?: boolean;
}

export interface HelpLauncherProps extends Omit<ComponentProps<"div">, "children" | "hidden"> {
  /** The entries of the menu, in order: docs, ways to reach you, shortcuts, status. */
  items: readonly HelpLauncherItem[];
  /** Which bottom corner it sits in. Default "bottom-right". */
  position?: "bottom-right" | "bottom-left";
  /** The button's text and its name. Default "Help". */
  label?: string;
  /** A line above the entries inside the menu: "How can we help?". Leave it out for the entries alone. */
  heading?: string;
  /** The menu is open. Pass it with `onOpenChange` to control the menu yourself. */
  open?: boolean;
  /** Start with the menu open, for a preview or a first-run tip. */
  defaultOpen?: boolean;
  /** The menu opened or closed, by the button, Escape, a click outside or choosing an entry. */
  onOpenChange?: (open: boolean) => void;
  /** Extra distance from the bottom edge as a CSS length, to clear another fixed element: "4.5rem" above a tab bar, "6rem" above a cookie banner. Added to the safe-area inset. Default "0px". */
  offset?: string;
  /** Hide the button on a page where it would cover content (a checkout, a full-screen editor). Nothing is drawn and the menu closes. */
  hidden?: boolean;
  /** Place it inside the nearest positioned ancestor instead of the browser window, for a preview, a docs frame or an embedded panel. */
  contained?: boolean;
}

const isExternal = (href: string | undefined) => Boolean(href && /^(https?:)?\/\//i.test(href));

function keysOf(shortcut: HelpLauncherItem["shortcut"]): readonly string[] {
  return typeof shortcut === "string" ? shortcut.split(/\s+/).filter(Boolean) : (shortcut ?? []);
}

function Row({ item }: { item: HelpLauncherItem }) {
  const keys = keysOf(item.shortcut);
  const external = isExternal(item.href);
  return (
    <>
      {item.icon ? (
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground [&_svg]:size-4">
          {item.icon}
        </span>
      ) : null}
      <span className="grid min-w-0 flex-1 gap-0.5 self-center">
        <span className="text-sm leading-5 font-medium tracking-[-0.01em] text-foreground">{item.label}</span>
        {item.description ? <span className="text-xs leading-4 text-muted-foreground">{item.description}</span> : null}
      </span>
      {keys.length ? (
        <KbdGroup className="shrink-0 self-center">
          {keys.map((key, index) => (
            <Kbd key={`${key}-${index}`}>{key}</Kbd>
          ))}
        </KbdGroup>
      ) : external ? (
        <IconArrowUpRight className="size-3.5 shrink-0 self-center text-muted-foreground" />
      ) : null}
      {external ? <span className="sr-only">(opens in a new tab)</span> : null}
    </>
  );
}

const ITEM = "cursor-pointer items-start gap-3 rounded-md px-2 py-2";

/**
 * The small Help button in the corner of an app. It opens a compact menu: a
 * way into the docs, the ways to reach you (chat, email), the keyboard
 * shortcuts and the status page, each with a line that says what to expect.
 * It is a real menu button, so the arrow keys move, Escape and a click outside
 * close it, and focus goes back to the button. It keeps off the screen edge
 * and the notch with safe-area offsets, can be lifted clear of another fixed
 * element with `offset`, and can be hidden on a page where it would cover
 * content. Unlike a chat widget it loads no third-party script: it is a
 * button and a list, and what each entry does is yours.
 */
export function HelpLauncher({
  items,
  position = "bottom-right",
  label = "Help",
  heading,
  open,
  defaultOpen,
  onOpenChange,
  offset = "0px",
  hidden = false,
  contained = false,
  className,
  style,
  ...props
}: HelpLauncherProps) {
  if (hidden) return null;

  const right = position === "bottom-right";
  const placement: CSSProperties = {
    bottom: `calc(1rem + env(safe-area-inset-bottom, 0px) + ${offset})`,
    [right ? "right" : "left"]: `calc(1rem + env(safe-area-inset-${right ? "right" : "left"}, 0px))`,
  };

  return (
    <div data-slot="help-launcher" data-position={position} className={cn(contained ? "absolute" : "fixed", "z-40", className)} style={{ ...placement, ...style }} {...props}>
      <DropdownMenu modal={false} open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button type="button" className="group/launcher h-11 rounded-full px-4 shadow-sm data-[state=open]:bg-primary/90">
            <IconHelp className="size-[1.125rem] group-data-[state=open]/launcher:hidden" />
            <IconClose className="hidden size-[1.125rem] group-data-[state=open]/launcher:block" />
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align={right ? "end" : "start"} sideOffset={10} collisionPadding={16} className="w-[min(21rem,calc(100vw-2rem))] p-1.5">
          {heading ? <DropdownMenuLabel className="px-2 pt-1.5 pb-2 font-sans text-sm font-semibold tracking-[-0.01em] text-foreground">{heading}</DropdownMenuLabel> : null}
          {items.map((item, index) => {
            const previous = items[index - 1];
            const rule = previous !== undefined && previous.group !== item.group;
            const external = isExternal(item.href);
            return (
              <Fragment key={item.id}>
                {rule ? <DropdownMenuSeparator className="-mx-1.5 my-1.5" /> : null}
                {item.href ? (
                  <DropdownMenuItem asChild disabled={item.disabled} className={ITEM}>
                    <a href={item.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                      <Row item={item} />
                    </a>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled={item.disabled} onSelect={() => item.onSelect?.()} className={ITEM}>
                    <Row item={item} />
                  </DropdownMenuItem>
                )}
              </Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
