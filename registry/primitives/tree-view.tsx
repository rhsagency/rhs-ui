"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TreeNode {
  id: string;
  label: string;
  icon?: ReactNode;
  children?: readonly TreeNode[];
}

export interface TreeViewProps {
  nodes: readonly TreeNode[];
  label: string;
  selected?: string | null;
  onSelectedChange?: (id: string) => void;
  defaultExpanded?: readonly string[];
  className?: string;
}

interface Flat {
  node: TreeNode;
  level: number;
  parent: string | null;
}

/**
 * A folder tree with the keyboard of a file manager: Up and Down move,
 * Right opens a folder or steps into it, Left closes it or goes to its
 * parent, Home and End jump, Enter selects, and typing a letter jumps to
 * the next item that starts with it. Only one item is in the tab order.
 */
export function TreeView({ nodes, label, selected, onSelectedChange, defaultExpanded = [], className }: TreeViewProps) {
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const [own, setOwn] = useState<string | null>(null);
  const chosen = selected === undefined ? own : selected;
  const [focus, setFocus] = useState<string | null>(null);
  const tree = useRef<HTMLUListElement>(null);
  const visible = useMemo(() => {
    const out: Flat[] = [];
    const walk = (list: readonly TreeNode[], level: number, parent: string | null) => {
      for (const node of list) {
        out.push({ node, level, parent });
        if (node.children?.length && expanded.has(node.id)) walk(node.children, level + 1, node.id);
      }
    };
    walk(nodes, 1, null);
    return out;
  }, [nodes, expanded]);
  const active = focus ?? chosen ?? visible[0]?.node.id ?? null;
  const moveTo = (id: string) => {
    setFocus(id);
    requestAnimationFrame(() => (tree.current?.querySelector(`[data-node="${CSS.escape(id)}"]`) as HTMLElement | null)?.focus());
  };
  const toggle = (id: string, open?: boolean) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (open ?? !next.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
  const choose = (id: string) => {
    if (selected === undefined) setOwn(id);
    onSelectedChange?.(id);
  };
  const onKey = (event: KeyboardEvent<HTMLLIElement>, item: Flat) => {
    const index = visible.findIndex((entry) => entry.node.id === item.node.id);
    const hasChildren = Boolean(item.node.children?.length);
    const open = expanded.has(item.node.id);
    const go = (target?: Flat) => target && (event.preventDefault(), moveTo(target.node.id));
    switch (event.key) {
      case "ArrowDown": return go(visible[index + 1]);
      case "ArrowUp": return go(visible[index - 1]);
      case "Home": return go(visible[0]);
      case "End": return go(visible[visible.length - 1]);
      case "ArrowRight":
        event.preventDefault();
        if (hasChildren && !open) toggle(item.node.id, true);
        else if (hasChildren) go(visible[index + 1]);
        return;
      case "ArrowLeft":
        event.preventDefault();
        if (hasChildren && open) toggle(item.node.id, false);
        else if (item.parent) moveTo(item.parent);
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(item.node.id);
        if (hasChildren) toggle(item.node.id);
        return;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const after = [...visible.slice(index + 1), ...visible.slice(0, index)];
          go(after.find((entry) => entry.node.label.toLowerCase().startsWith(event.key.toLowerCase())));
        }
    }
  };
  return (
    <ul ref={tree} role="tree" aria-label={label} data-slot="tree-view" className={cn("grid gap-px text-sm", className)}>
      {visible.map((item) => {
        const hasChildren = Boolean(item.node.children?.length);
        const open = expanded.has(item.node.id);
        const isSelected = chosen === item.node.id;
        return (
          <li
            key={item.node.id}
            role="treeitem"
            data-node={item.node.id}
            aria-level={item.level}
            aria-expanded={hasChildren ? open : undefined}
            aria-selected={isSelected}
            tabIndex={item.node.id === active ? 0 : -1}
            onKeyDown={(event) => onKey(event, item)}
            onClick={() => {
              setFocus(item.node.id);
              choose(item.node.id);
              if (hasChildren) toggle(item.node.id);
            }}
            className={cn(
              "flex h-8 cursor-default items-center gap-1.5 rounded-md pr-2 outline-none select-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40",
              isSelected && "bg-muted font-medium",
            )}
            style={{ paddingLeft: `${(item.level - 1) * 16 + 6}px` }}
          >
            <IconChevronRight size={14} aria-hidden="true" className={cn("shrink-0 text-muted-foreground transition-transform duration-150", open && "rotate-90", !hasChildren && "invisible")} />
            {item.node.icon ? <span className="grid shrink-0 place-items-center text-muted-foreground [&_svg]:size-4">{item.node.icon}</span> : null}
            <span className="truncate">{item.node.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
