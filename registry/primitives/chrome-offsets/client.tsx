"use client";

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";

/** The four edges a fixed bar can sit on. `start` and `end` follow the writing direction: left and right in English, the other way round in Arabic. */
export type ChromeEdge = "top" | "bottom" | "start" | "end";

/** How much room the fixed bars take on each edge, in pixels. */
export type ChromeSizes = Record<ChromeEdge, number>;

const EDGES: readonly ChromeEdge[] = ["top", "bottom", "start", "end"];

const ZERO: ChromeSizes = { top: 0, bottom: 0, start: 0, end: 0 };

type Report = (id: string, edge: ChromeEdge, size: number | null) => void;

/** What a bar tells the provider. It never changes, so a bar does not render again when a size does. */
const ReportContext = createContext<Report | null>(null);

/** The sizes, for the one that wants numbers: `useChromeOffsets`. */
const SizesContext = createContext<ChromeSizes>(ZERO);

/** The layout effect that does not warn on the server, where there is no layout. */
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface ChromeOffsetsRootProps extends ComponentProps<"div"> {
  /** What the variables are before anything is measured, in pixels: on the server, and without JavaScript. Set them to the sizes your bars have at rest. Read once, when the component first renders. */
  defaults?: Partial<ChromeSizes>;
  /** The element to render. Default `div`. */
  as?: "div" | "main" | "section";
}

/**
 * The provider: it keeps the sizes of the bars inside it and writes them on its own element as `--chrome-top`, `--chrome-bottom`,
 * `--chrome-start` and `--chrome-end`, plain lengths in pixels. Use `ChromeOffsets` from the folder's index, which adds the bars.
 */
export function ChromeOffsetsRoot({ defaults, as = "div", className, style, children, ...props }: ChromeOffsetsRootProps) {
  const Tag = as as "div";
  const bars = useRef(new Map<string, { edge: ChromeEdge; size: number }>());
  const measured = useRef(new Set<ChromeEdge>());
  const [sizes, setSizes] = useState<ChromeSizes>({ ...ZERO, ...defaults });

  const report = useCallback<Report>((id, edge, size) => {
    if (size === null) bars.current.delete(id);
    else {
      bars.current.set(id, { edge, size });
      measured.current.add(edge);
    }
    setSizes((current) => {
      // An edge that has had a bar is the sum of its bars (nothing, once the last one is gone); an edge that never has keeps its default.
      const next = { ...current };
      for (const edgeName of EDGES) if (measured.current.has(edgeName)) next[edgeName] = 0;
      for (const bar of bars.current.values()) next[bar.edge] += bar.size;
      return EDGES.every((edgeName) => next[edgeName] === current[edgeName]) ? current : next;
    });
  }, []);

  const variables = Object.fromEntries(EDGES.map((edge) => [`--chrome-${edge}`, `${sizes[edge]}px`]));
  return (
    <ReportContext.Provider value={report}>
      <SizesContext.Provider value={sizes}>
        <Tag data-slot="chrome-offsets" style={{ ...variables, ...style } as CSSProperties} className={className} {...props}>
          {children}
        </Tag>
      </SizesContext.Provider>
    </ReportContext.Provider>
  );
}

export interface ChromeOffsetsBarProps extends ComponentProps<"div"> {
  /** The edge of the screen this bar is fixed to. */
  edge: ChromeEdge;
  /** The element to render. When the part is the bar itself, `header`, `nav` or `footer` make it the landmark it is. Default `div`. */
  as?: "div" | "header" | "nav" | "footer" | "aside";
}

/**
 * A fixed bar that reports its size. Wrap the bar in it, or give it the classes that fix it to its edge and let it be the bar: either
 * way what is measured is the room the bar takes. A wrapper around a fixed or absolute bar has no box of its own, so the bar inside is
 * measured instead. The size is followed with a ResizeObserver, so a banner that appears or a navigation that wraps is picked up at once,
 * and never with a scroll handler. Use `ChromeOffsets.Top` and its siblings from the folder's index.
 */
export function ChromeOffsetsBar({ edge, as = "div", ref, ...props }: ChromeOffsetsBarProps) {
  const Tag = as as "div";
  const node = useRef<HTMLDivElement | null>(null);
  // The bar needs its own ref to measure itself, and the caller may want theirs too.
  const attach = (element: HTMLDivElement | null) => {
    node.current = element;
    if (typeof ref === "function") ref(element);
    else if (ref) ref.current = element;
  };
  const id = useId();
  const report = useContext(ReportContext);
  useBrowserLayoutEffect(() => {
    const element = node.current;
    if (!element || !report) return;
    const vertical = edge === "top" || edge === "bottom";
    const extent = (target: Element) => {
      const box = target.getBoundingClientRect();
      return vertical ? box.height : box.width;
    };
    const read = () => {
      // A wrapper whose bar is out of the flow (fixed) is as high as nothing: the bars inside it are what takes the room.
      const size = extent(element) >= 1 ? extent(element) : [...element.children].reduce((sum, child) => sum + extent(child), 0);
      report(id, edge, Math.round(size * 100) / 100);
    };
    const observer = new ResizeObserver(read);
    const watch = () => {
      observer.disconnect();
      observer.observe(element);
      for (const child of element.children) observer.observe(child);
    };
    // A bar that comes and goes inside the wrapper (a banner that is closed) is watched from the moment it arrives.
    const mutations = new MutationObserver(() => {
      watch();
      read();
    });
    watch();
    read();
    mutations.observe(element, { childList: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
      report(id, edge, null);
    };
  }, [edge, id, report]);
  return <Tag ref={attach} data-slot="chrome-offsets-bar" data-edge={edge} {...props} />;
}

/**
 * The sizes of the bars as numbers, for code that needs them (a scroll into view, an IntersectionObserver margin). Inside a
 * `ChromeOffsets`; anywhere else it is zero.
 */
export function useChromeOffsets(): ChromeSizes {
  return useContext(SizesContext);
}
