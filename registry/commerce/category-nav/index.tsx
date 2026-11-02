import type { ComponentProps, ElementType, MouseEvent, ReactNode } from "react";

import { IconChevronDown, IconChevronLeft } from "@rhs-ui/icons";
import { pathTo, type CategoryNode } from "@rhs-ui/commerce/category-nav/tree";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

export type { CategoryNode } from "@rhs-ui/commerce/category-nav/tree";

export interface CategoryNavLabels {
  /** The name of the nav landmark. */
  nav?: string;
  /** The link back to the top of the tree. */
  all?: string;
  /** The button that opens the rest of a long list. `{count}` is how many are folded. */
  more?: string;
  /** The same button once it is open. */
  fewer?: string;
  /** After a count, for a screen reader. `{count}` product. */
  productOne?: string;
  /** `{count}` products. */
  productOther?: string;
}

const WORDS = {
  nav: "Categories",
  all: "All categories",
  more: "Show {count} more",
  fewer: "Show fewer",
  productOne: "{count} product",
  productOther: "{count} products",
} satisfies Required<CategoryNavLabels>;

export interface CategoryNavProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The top-level categories, each with its children. Only the branch you are in is drawn. */
  tree: readonly CategoryNode[];
  /** The category you are in, or leave it out at the top: "All categories" is then the current one and the top level are its children. */
  currentId?: string | null;
  /** Called when a category link is clicked, with the category (null for "All categories"). Call `event.preventDefault()` to route on the client; without it the link is followed as usual. */
  onNavigate?: (category: CategoryNode | null, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Show how many products are in each category. Defaults to true. */
  showCounts?: boolean;
  /** How many children are listed before the rest folds under "Show N more". A list that would fold only one is shown whole. Defaults to 6. */
  maxChildren?: number;
  /** List the categories beside the current one, under the same parent. Defaults to true. */
  showSiblings?: boolean;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Where "All categories" goes. Defaults to "/". */
  allHref?: string;
  /** Always pass your application locale, so the server and the browser write the same counts. */
  locale?: string;
  /** The words, for another language. */
  labels?: CategoryNavLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

const ROW =
  "flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm leading-snug outline-none transition-colors duration-150 hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";
const LIST = "grid gap-0.5";
/** The categories beside the current one line their labels up with the labels of the parents above, behind the back arrow, so a deep tree gets longer and never wider. */
const BESIDE = "pl-[2.125rem]";
/** The children of the current category hang from a guide line under its label. Without parents above there is no back arrow, so the label sits further left. */
const BELOW = "mt-0.5 grid gap-0.5 border-l border-border pl-2";

/**
 * The category list of a shop or a help centre, kept short by showing where you are instead of everything: a link
 * back to all categories, the parents above as links, the categories beside the current one, the current one in
 * bold with `aria-current`, and its children indented under it with their product counts. A long list of children
 * folds under "Show 8 more" and the button stays where it is, so the focus is never lost. A category with no
 * products is dimmed, not removed, so the tree stays whole. It is one nav landmark named Categories and needs no
 * JavaScript to follow a link.
 */
export function CategoryNav({
  tree,
  currentId,
  onNavigate,
  showCounts = true,
  maxChildren = 6,
  showSiblings = true,
  linkAs: Link = "a",
  allHref = "/",
  locale = "en-US",
  labels,
  className,
  ...props
}: CategoryNavProps) {
  const words: Required<CategoryNavLabels> = { ...WORDS, ...labels };
  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const path = currentId ? (pathTo(tree, currentId) ?? []) : [];
  const click = (category: CategoryNode | null) => (onNavigate ? (event: MouseEvent<HTMLAnchorElement>) => onNavigate(category, event) : undefined);

  /** The number at the end of the row, for the eye. */
  function count(node: CategoryNode): ReactNode {
    if (!showCounts || node.count === undefined) return null;
    return (
      <span aria-hidden="true" className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
        {numbers.format(node.count)}
      </span>
    );
  }

  /** The same number in words, inside the name of the link, so it reads "Midi, 112 products" with no gap. */
  function counted(node: CategoryNode): ReactNode {
    if (!showCounts || node.count === undefined) return null;
    return <span className="sr-only">, {fill(plural.select(node.count) === "one" ? words.productOne : words.productOther, { count: numbers.format(node.count) })}</span>;
  }

  /** One category as a link: a parent (a way back), the current one, or a category you can go to. */
  function link(node: CategoryNode, kind: "parent" | "current" | "other", beside = false): ReactNode {
    const empty = node.count === 0;
    return (
      <Link
        href={node.href}
        aria-current={kind === "current" ? "page" : undefined}
        onClick={click(node)}
        className={cn(ROW, beside && BESIDE, kind === "parent" && "text-muted-foreground hover:text-foreground", kind === "current" && "bg-muted font-semibold text-foreground", empty && "text-muted-foreground/80")}
      >
        {kind === "parent" ? <IconChevronLeft aria-hidden="true" className="size-4 shrink-0" /> : null}
        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          {node.label}
          {kind === "parent" ? null : counted(node)}
        </span>
        {kind === "parent" ? null : count(node)}
      </Link>
    );
  }

  /** The children of the current category: the first few as links, the rest behind a button that stays in place. */
  function children(nodes: readonly CategoryNode[]): ReactNode {
    const shown = nodes.length > maxChildren + 1 ? nodes.slice(0, maxChildren) : nodes;
    const folded = nodes.slice(shown.length);
    return (
      <ul role="list" className={cn(BELOW, path.length > 0 ? "ml-[1.625rem]" : "ml-2")}>
        {shown.map((node) => (
          <li key={node.id}>{link(node, "other")}</li>
        ))}
        {folded.length > 0 ? (
          <li>
            <Collapsible>
              <CollapsibleTrigger className={cn(ROW, "group/more cursor-pointer text-muted-foreground hover:text-foreground")}>
                <span className="group-data-[state=open]/more:hidden">{fill(words.more, { count: numbers.format(folded.length) })}</span>
                <span className="hidden group-data-[state=open]/more:inline">{words.fewer}</span>
                <IconChevronDown aria-hidden="true" className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/more:rotate-180 motion-reduce:transition-none" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul role="list" className={cn(LIST, "pt-0.5")}>
                  {folded.map((node) => (
                    <li key={node.id}>{link(node, "other")}</li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </li>
        ) : null}
      </ul>
    );
  }

  /** One level of the branch: the parents on the way to the current category each open the next level; the current one opens its children. */
  function level(depth: number, nodes: readonly CategoryNode[]): ReactNode {
    const lastLevel = depth === path.length - 1;
    return (
      <ul role="list" className="mt-0.5 grid gap-0.5">
        {nodes.map((node) => {
          const here = path[depth];
          if (here?.id !== node.id) return <li key={node.id}>{link(node, "other", true)}</li>;
          const last = depth === path.length - 1;
          return (
            <li key={node.id}>
              {link(node, last ? "current" : "parent", lastLevel)}
              {last ? (node.children?.length ? children(node.children) : null) : level(depth + 1, depth + 1 === path.length - 1 && showSiblings ? (node.children ?? []) : [path[depth + 1] as CategoryNode])}
            </li>
          );
        })}
      </ul>
    );
  }

  const atTop = path.length === 0;
  const first = path[0];
  return (
    <nav data-slot="category-nav" aria-label={words.nav} className={cn("min-w-0", className)} {...props}>
      <ul role="list" className={LIST}>
        <li>
          <Link
            href={allHref}
            aria-current={atTop ? "page" : undefined}
            onClick={click(null)}
            className={cn(ROW, atTop ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {atTop ? null : <IconChevronLeft aria-hidden="true" className="size-4 shrink-0" />}
            <span className="min-w-0 flex-1">{words.all}</span>
          </Link>
          {atTop ? children(tree) : first ? level(0, path.length === 1 && showSiblings ? tree : [first]) : null}
        </li>
      </ul>
    </nav>
  );
}
