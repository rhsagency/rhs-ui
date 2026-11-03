"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Container, type ContainerElement, type ContainerSize } from "@rhs-ui/primitives/container";

/** The five widths: `cap` is the max-width in rem, or null for no limit. */
const WIDTHS: readonly { size: ContainerSize; cap: number | null; note: string }[] = [
  { size: "narrow", cap: 40, note: "Sign-in, checkout, a single form" },
  { size: "prose", cap: 46, note: "Articles, docs, long-form copy" },
  { size: "default", cap: 72, note: "Most pages: marketing, settings, lists" },
  { size: "wide", cap: 88, note: "Dashboards, galleries, tables" },
  { size: "full", cap: null, note: "Edge to edge, still with gutters" },
];

const LANDMARKS: readonly { as: ContainerElement; size: ContainerSize; note: string }[] = [
  { as: "header", size: "wide", note: "Brand and navigation" },
  { as: "main", size: "default", note: "The page itself" },
  { as: "footer", size: "wide", note: "Legal and links" },
];

/** The width of the content a Container leaves, measured: it follows the window as you resize it. */
function useContentWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number | null] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () => {
      const style = getComputedStyle(node);
      setWidth(Math.round(node.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function Heading({ id, title, children }: { id: string; title: string; children: ReactNode }): React.JSX.Element {
  return (
    <Container size="default" className="mb-5">
      <h2 id={id} className="text-lg font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{children}</p>
    </Container>
  );
}

/** One line between the strips, and one at each end, so two neighbours never show a pair of rules with a gap between them. */
const STRIPS = "divide-y divide-border border-y border-border";

function Ruler({ size, rem, note, fills }: { size: ContainerSize; rem: string; note: string; fills?: string }): React.JSX.Element {
  const [ref, width] = useContentWidth<HTMLDivElement>();
  return (
    <div className="py-3">
      <Container ref={ref} size={size} className="bg-foreground/[0.08] py-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 rounded-md border border-border bg-background px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-[-0.01em]">{size}</p>
            <p className="truncate text-xs text-muted-foreground">{note}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs">{rem}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{width === null ? "…" : width.toLocaleString("en-US")}px of content</p>
          </div>
          {fills ? <p className="col-span-full border-t border-dashed border-border pt-2.5 text-xs text-muted-foreground">{fills}</p> : null}
        </div>
      </Container>
    </div>
  );
}

/**
 * The five strips. The window is measured too: a Container only stops at its cap when the window is wider than the cap, so the
 * first size the window cannot hold says so, and the sizes after it look the same for the same reason (at 1280px, wide and full).
 */
function Widths(): React.JSX.Element {
  const list = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<{ px: number; rem: number } | null>(null);
  useEffect(() => {
    const node = list.current;
    if (!node) return;
    const read = () => setRoom({ px: node.clientWidth, rem: Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const first = room === null ? undefined : WIDTHS.find((width) => width.cap !== null && width.cap * room.rem > room.px);
  return (
    <div ref={list} className={STRIPS}>
      {WIDTHS.map((width) => (
        <Ruler
          key={width.size}
          size={width.size}
          rem={width.cap === null ? "no limit" : `${width.cap}rem`}
          note={width.note}
          fills={first?.size === width.size ? `The window is narrower than ${width.cap}rem here, so ${width.size} fills it, and so does every wider size.` : undefined}
        />
      ))}
    </div>
  );
}

function Nested({ padded, label, note }: { padded: boolean; label: string; note: string }): React.JSX.Element {
  const [ref, width] = useContentWidth<HTMLDivElement>();
  return (
    <div className="py-3">
      <Container size="wide" className="bg-foreground/[0.06] py-2.5">
        <div className="rounded-md border border-border bg-background px-3.5 py-3">
          <p className="text-sm font-medium tracking-[-0.01em]">{label}</p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
        <Container ref={ref} size="prose" padded={padded} className="mt-2.5 bg-foreground/[0.14] py-2.5">
          <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background px-3.5 py-3">
            <p className="text-sm">prose</p>
            <p className="text-xs text-muted-foreground tabular-nums">{width === null ? "…" : width.toLocaleString("en-US")}px of content</p>
          </div>
        </Container>
      </Container>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-16 py-12">
      <section aria-labelledby="container-widths">
        <Heading id="container-widths" title="Five widths">
          The darker band is the Container, the card is its content. The gutters grow from 16px on a phone to 32px on a desktop, so text never touches the edge.
        </Heading>
        <Widths />
      </section>

      <section aria-labelledby="container-nesting">
        <Heading id="container-nesting" title="Nesting">
          A Container inside a Container would pad twice. Turn the gutters off on the inner one and it only caps the width.
        </Heading>
        <div className={STRIPS}>
          <Nested padded label="Inner Container, padded (the default)" note="The inner Container pads again, so its content ends up narrower than the cap." />
          <Nested padded={false} label="Inner Container, padded={false}" note="Only the width is capped: the content gets the whole column." />
        </div>
      </section>

      {/* Not a labelled region: a main landmark may not sit inside another landmark. */}
      <section>
        <Heading id="container-landmarks" title="Landmarks without wrappers">
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">as</code> renders the element a page is made of, so the container is the landmark.
        </Heading>
        <div className={STRIPS}>
          {LANDMARKS.map((landmark) => (
            <div key={landmark.as} className="py-3">
              <Container as={landmark.as} size={landmark.size} className="bg-foreground/[0.08] py-2.5">
                <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background px-3.5 py-3">
                  <p className="font-mono text-xs">{`<${landmark.as}>`}</p>
                  <p className="text-xs text-muted-foreground">{landmark.note}</p>
                </div>
              </Container>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
