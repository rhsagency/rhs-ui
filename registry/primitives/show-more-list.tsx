"use client";

import { Children, isValidElement, useId, useRef, useState, type ComponentProps, type Key, type ReactNode } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

interface ShowMoreListBase extends Omit<ComponentProps<"ul">, "children" | "className"> {
  /** Classes for the wrapper around the list and its button. */
  className?: string;
  /** Classes for the list itself. It is a grid with a 12px gap; replace that to suit rows or cards. */
  listClassName?: string;
  /** Classes for every item. */
  itemClassName?: string;
  /** How many items show before anyone asks. Default 5. */
  initialCount?: number;
  /** How many more each press reveals. Leave it out to reveal everything at once. */
  step?: number;
  /** What the items are, so the button names what it reveals: "Show 7 more reviews". A string is used as it is; `{ one, other }` picks the singular when one is left. */
  noun?: string | { one: string; other: string };
  /** The words on the button and in the status, for another language. `more` gets how many a press reveals and how many are hidden. */
  labels?: { more?: (count: number, hidden: number) => string; less?: string; status?: (shown: number, total: number) => string };
  /** `ol` when the order matters. Default "ul". */
  as?: "ul" | "ol";
  /** The look of the button. Default "outline". */
  toggleVariant?: ButtonProps["variant"];
  /** Classes for the button. */
  toggleClassName?: string;
}

export type ShowMoreListProps<T> = ShowMoreListBase &
  (
    | {
        /** The data, already in memory. Only the items that show are rendered. */
        items: readonly T[];
        /** How one item looks. It must be a plain function; from a Server Component pass `children` instead. */
        renderItem: (item: T, index: number) => ReactNode;
        /** A stable key for an item. Defaults to its position. */
        getKey?: (item: T, index: number) => Key;
        children?: never;
      }
    | {
        /** The items, already drawn. Each child becomes one list item. Use this from a Server Component, where a function cannot be passed. */
        children: ReactNode;
        items?: never;
        renderItem?: never;
        getKey?: never;
      }
  );

/**
 * A list that shows its first few items and a button for the rest: "Show 7 more
 * reviews", then "Show less". The button names what it reveals, carries
 * `aria-expanded` and `aria-controls`, and a polite status says how many are
 * showing. Newly revealed items do not take focus: it stays on the button, and
 * after "Show less" the button is scrolled back into view. With `step` it
 * reveals in chunks; the new items ease in unless reduced motion is on. Unlike
 * Load more it works on data you already have and makes no request. Pass `items`
 * and `renderItem`, or the drawn items as `children`.
 */
export function ShowMoreList<T>(props: ShowMoreListProps<T>) {
  const {
    items,
    renderItem,
    getKey,
    children,
    initialCount = 5,
    step,
    noun,
    labels,
    as: listTag = "ul",
    className,
    listClassName,
    itemClassName,
    toggleVariant = "outline",
    toggleClassName,
    ...rest
  } = props;
  // An `ol` takes the same attributes as a `ul`; only the type of its ref differs.
  const List = listTag as "ul";
  const listId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const base = Math.max(0, Math.floor(initialCount));
  const [visible, setVisible] = useState(base);
  // Where the newest reveal began, so only those items ease in.
  const [from, setFrom] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  const drawn = items === undefined ? Children.toArray(children) : null;
  const total = items?.length ?? drawn?.length ?? 0;
  const shown = Math.min(visible, total);
  const hidden = total - shown;
  const chunk = Math.min(step !== undefined && step > 0 ? Math.floor(step) : hidden, hidden);

  const nameFor = (count: number) => (typeof noun === "object" ? (count === 1 ? noun.one : noun.other) : noun);
  const more = labels?.more ? labels.more(chunk, hidden) : `Show ${chunk} more${nameFor(chunk) ? ` ${nameFor(chunk)}` : ""}`;
  const label = hidden > 0 ? more : (labels?.less ?? "Show less");
  const said = (count: number) => (labels?.status ? labels.status(count, total) : `Showing ${count} of ${total}${nameFor(total) ? ` ${nameFor(total)}` : ""}`);

  const reveal = () => {
    const to = Math.min(total, shown + chunk);
    setFrom(shown);
    setVisible(to);
    setStatus(said(to));
  };
  const collapse = () => {
    setFrom(null);
    setVisible(base);
    setStatus(said(Math.min(base, total)));
    // The list gets shorter under the button; bring the button back to where the eye is.
    requestAnimationFrame(() => toggle.current?.scrollIntoView({ block: "nearest" }));
  };

  const entries =
    items !== undefined && renderItem
      ? items.slice(0, shown).map((item, index): { key: Key; node: ReactNode } => ({ key: getKey ? getKey(item, index) : index, node: renderItem(item, index) }))
      : (drawn ?? []).slice(0, shown).map((node, index): { key: Key; node: ReactNode } => ({ key: isValidElement(node) && node.key !== null ? node.key : index, node }));

  if (total === 0) return null;
  return (
    <div data-slot="show-more-list" data-expanded={shown > base} className={className}>
      <List id={listId} className={cn("grid gap-3", listClassName)} {...rest}>
        {entries.map(({ key, node }, index) => (
          <li
            key={key}
            className={cn(itemClassName, from !== null && index >= from && "animate-rhs-list-reveal motion-reduce:animate-none")}
            style={from !== null && index >= from ? { animationDelay: `${Math.min(index - from, 8) * 40}ms` } : undefined}
          >
            {node}
          </li>
        ))}
      </List>
      {total > base ? (
        <Button
          ref={toggle}
          type="button"
          variant={toggleVariant}
          size="sm"
          aria-expanded={shown > base}
          aria-controls={listId}
          onClick={hidden > 0 ? reveal : collapse}
          className={cn("mt-4", toggleClassName)}
        >
          {label}
          <IconChevronDown className={cn("transition-transform duration-200 motion-reduce:transition-none", hidden === 0 && "rotate-180")} />
        </Button>
      ) : null}
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
