"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { TextSkeleton, type TextSkeletonSize } from "@rhs-ui/primitives/text-skeleton";
import { cn } from "@/lib/utils";

function Example({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={cn("grid min-w-0 grid-cols-1 content-start gap-3", className)}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The rendered height of an element, kept up to date as it resizes. */
function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () => setHeight(Math.round(node.getBoundingClientRect().height));
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}

const SIZES: readonly { size: TextSkeletonSize; note: string }[] = [
  { size: "h1", note: "36 / 40" },
  { size: "h2", note: "30 / 36" },
  { size: "h3", note: "24 / 32" },
  { size: "h4", note: "20 / 28" },
  { size: "lg", note: "18 / 28" },
  { size: "base", note: "16 / 24" },
  { size: "sm", note: "14 / 20" },
];

function Card({ children, className }: { children: ReactNode; className?: string }): React.JSX.Element {
  return <div className={cn("grid content-start gap-3 rounded-xl border border-border bg-card p-5 shadow-xs", className)}>{children}</div>;
}

export default function Demo(): React.JSX.Element {
  const [loadingRef, loadingHeight] = useHeight<HTMLDivElement>();
  const [loadedRef, loadedHeight] = useHeight<HTMLDivElement>();
  const same = loadingHeight !== null && loadingHeight === loadedHeight;

  return (
    // Two columns only when the preview itself is wide enough for two panels: the width of the page says nothing about the pane the demo gets.
    <div className="@container w-full max-w-4xl">
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Example caption="While loading: a bar per line, in the line height of the text it stands in for">
          <Card>
            <div ref={loadingRef} className="grid gap-3">
              <TextSkeleton size="sm" lines={1} width="38%" seed="kicker" />
              <TextSkeleton size="h3" lines={2} seed="title" />
              <TextSkeleton size="base" lines={3} seed="summary" />
              <TextSkeleton size="sm" lines={1} width="55%" seed="byline" />
            </div>
          </Card>
        </Example>

        <Example caption="Loaded: the same card with real text, clamped to the same number of lines">
          <Card>
            <div ref={loadedRef} className="grid gap-3">
              <p className="truncate text-sm text-muted-foreground">Field notes</p>
              <h2 className="line-clamp-2 text-2xl font-medium tracking-[-0.03em]">Why our checkout feels faster after the rewrite</h2>
              <p className="line-clamp-3 text-base text-muted-foreground">
                We stopped waiting for the whole page and started showing each part as it arrived. Here is what changed in the cart, the address form and the payment step, and what we measured afterwards.
              </p>
              <p className="truncate text-sm text-muted-foreground">Mara de Vries, 6 min read</p>
            </div>
          </Card>
        </Example>

        <div className="@3xl:col-span-2">
          {/* The verdict wraps onto a second line in a narrow demo; the server's "Measuring..." keeps that room, so the page below does not step when it is replaced. */}
          <p className="text-center text-xs text-muted-foreground tabular-nums @max-[19.1875rem]:min-h-8">
            {loadingHeight === null || loadedHeight === null
              ? "Measuring..."
              : same
                ? `Both are ${loadingHeight}px tall: swapping the text in moves nothing.`
                : `${loadingHeight}px while loading, ${loadedHeight}px loaded.`}
          </p>
        </div>

        <Example caption="One bar per line at every size, body text and headings">
          <Card>
            <ul className="grid gap-3.5">
              {SIZES.map(({ size, note }) => (
                <li key={size} className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-3">
                  <span className="grid gap-0.5 font-mono text-[0.6875rem] leading-none text-muted-foreground">
                    <span className="text-xs text-foreground">{size}</span>
                    <span className="tabular-nums">{note}</span>
                  </span>
                  <TextSkeleton size={size} lines={1} seed={size} width="86%" />
                </li>
              ))}
            </ul>
          </Card>
        </Example>

        <Example caption="Lengths come from a seed, so a block looks the same on the server and in the browser: change the seed to change the shape">
          <Card className="gap-5">
            {[
              { seed: "a", width: "100%" },
              { seed: "b", width: "80%" },
              { seed: "c", width: "60%" },
            ].map(({ seed, width }) => (
              <div key={seed} className="grid gap-1.5">
                <p className="font-mono text-[0.6875rem] text-muted-foreground">
                  seed &quot;{seed}&quot;, width {width}
                </p>
                <TextSkeleton lines={3} seed={seed} width={width} />
              </div>
            ))}
          </Card>
        </Example>
      </div>
    </div>
  );
}
