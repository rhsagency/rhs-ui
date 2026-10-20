"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CrossfadeProps extends Omit<ComponentProps<"div">, "ref" | "children"> {
  /** Identifies what is showing. When it changes, the content fades over to the new children. */
  activeKey: string | number;
  /** The content for the current key. Only this is rendered; the previous content stays until it has faded out. */
  children: ReactNode;
  /** Milliseconds of each fade. */
  duration?: number;
  /** `overlap` fades both at once; `wait` lets the old content leave before the new arrives. */
  mode?: "overlap" | "wait";
  /** Move focus to the new content after a change, for a step or panel the reader has just asked for. */
  moveFocus?: boolean;
}

interface Layer {
  id: number;
  node: ReactNode;
  leaving: boolean;
  entering: boolean;
}

interface State {
  key: string | number;
  seq: number;
  layers: Layer[];
}

/**
 * Swaps content with a soft crossfade and no jump: tab panels, a skeleton
 * becoming its content, a step in a form. Old and new share one grid cell,
 * so while they overlap the container is as tall as the taller of the two;
 * put an AutoHeight around it when the two differ and the rest of the page
 * should glide instead of snapping at the end. The leaving content is made
 * inert and hidden from assistive technology at once, the new content takes
 * focus only when `moveFocus` asks for it, and reduced motion swaps instantly.
 */
export function Crossfade({ activeKey, children, duration = 220, mode = "overlap", moveFocus = false, className, style, ...props }: CrossfadeProps) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef<ReactNode>(children);
  const shownKey = useRef(activeKey);
  const [state, setState] = useState<State>(() => ({ key: activeKey, seq: 0, layers: [{ id: 0, node: null, leaving: false, entering: false }] }));

  // A new key: the current layer starts leaving (with the content it last showed) and a new one enters.
  if (state.key !== activeKey) {
    const seq = state.seq + 1;
    setState({
      key: activeKey,
      seq,
      layers: [...state.layers.map((layer) => (layer.leaving ? layer : { ...layer, leaving: true, node: latest.current })), { id: seq, node: null, leaving: false, entering: true }],
    });
  }

  useLayoutEffect(() => {
    latest.current = children;
  });

  // Let the new layer paint at zero first, then fade it in.
  const entering = state.layers.some((layer) => layer.entering);
  useLayoutEffect(() => {
    if (!entering) return;
    void root.current?.offsetHeight;
    setState((current) => ({ ...current, layers: current.layers.map((layer) => (layer.entering ? { ...layer, entering: false } : layer)) }));
  }, [entering]);

  // Drop the leaving layers once they are invisible.
  const leaving = state.layers.some((layer) => layer.leaving);
  useEffect(() => {
    if (!leaving) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = reduced ? 0 : (mode === "wait" ? duration * 2 : duration) + 40;
    const id = window.setTimeout(() => setState((current) => ({ ...current, layers: current.layers.filter((layer) => !layer.leaving) })), wait);
    return () => window.clearTimeout(id);
  }, [leaving, state.seq, duration, mode]);

  useEffect(() => {
    if (shownKey.current === activeKey) return;
    shownKey.current = activeKey;
    if (!moveFocus) return;
    const layers = root.current?.querySelectorAll<HTMLElement>('[data-slot="crossfade-layer"]:not([data-state="leaving"])');
    layers?.[layers.length - 1]?.focus({ preventScroll: true });
  }, [activeKey, moveFocus]);

  const vars = { "--rhs-crossfade-duration": `${duration}ms`, "--rhs-crossfade-wait": mode === "wait" ? `${duration}ms` : "0ms" } as CSSProperties;

  return (
    <div ref={root} data-slot="crossfade" className={cn("grid grid-cols-[minmax(0,1fr)]", className)} style={{ ...vars, ...style }} {...props}>
      {state.layers.map((layer) => (
        <div
          key={layer.id}
          data-slot="crossfade-layer"
          data-state={layer.leaving ? "leaving" : layer.entering ? "entering" : "present"}
          inert={layer.leaving || undefined}
          aria-hidden={layer.leaving || undefined}
          tabIndex={moveFocus && !layer.leaving ? -1 : undefined}
          className="col-start-1 row-start-1 min-w-0 outline-none transition-opacity duration-[var(--rhs-crossfade-duration,220ms)] ease-out motion-reduce:transition-none data-[state=entering]:opacity-0 data-[state=leaving]:pointer-events-none data-[state=leaving]:opacity-0 data-[state=present]:delay-[var(--rhs-crossfade-wait,0ms)]"
        >
          {layer.leaving ? layer.node : children}
        </div>
      ))}
    </div>
  );
}
