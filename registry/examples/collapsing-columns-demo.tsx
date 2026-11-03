"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { CollapsingColumns } from "@rhs-ui/primitives/collapsing-columns";
import { Slider } from "@rhs-ui/primitives/slider";

const STATS = [
  { label: "Orders", value: "11,400", note: "a month, across 240 shops" },
  { label: "Checkout", value: "31%", note: "faster than four steps" },
  { label: "Uptime", value: "99.98%", note: "over twelve months" },
];

/** The width of the content box of an element, kept current as it changes. */
function useContentWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number | null] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () => setWidth(Math.round(node.clientWidth));
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function Cell({ label, value, note }: { label: string; value: string; note: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function Stage({ title, note, width, children }: { title: string; note: string; width: number; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
      <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{note}</p>
      <div className="max-w-full rounded-xl border border-dashed border-border bg-muted/30 p-3" style={{ width }}>
        {children}
      </div>
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [width, setWidth] = useState(350);
  const [measure, inner] = useContentWidth<HTMLDivElement>();
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 px-4 py-8 sm:px-6">
      <div className="grid gap-6">
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
          <span className="text-sm font-medium">Space available</span>
          <Slider thumbLabels={["Width in pixels"]} min={280} max={436} step={2} value={[width]} onValueChange={([next]) => setWidth(next ?? 350)} />
          <p role="status" className="text-sm text-muted-foreground tabular-nums sm:w-44 sm:text-end sm:leading-tight">
            {inner === null ? "…" : `${inner}px: ${inner >= 352 ? "one row" : "one column"}`}
            <span className="block text-xs">stacks below 352px</span>
          </p>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <Stage title="Collapsing columns" note="Three across while there is room, then one column. Never two and one." width={width}>
            <CollapsingColumns ref={measure} threshold="22rem" gap="sm">
              {STATS.map((stat) => (
                <Cell key={stat.label} {...stat} />
              ))}
            </CollapsingColumns>
          </Stage>
          <Stage title="A wrapping grid" note="Cells at least 6.5rem wide. The third waits alone." width={width}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-3">
              {STATS.map((stat) => (
                <Cell key={stat.label} {...stat} />
              ))}
            </div>
          </Stage>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold tracking-[-0.01em]">The container decides, not the window</h2>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">One component with one threshold (26rem). In the page it is a row, in the sidebar a column.</p>
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Overview</p>
            <CollapsingColumns threshold="26rem" gap="sm">
              {STATS.map((stat) => (
                <Cell key={stat.label} {...stat} />
              ))}
            </CollapsingColumns>
          </div>
          <aside aria-label="This week" className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className="mb-3 text-xs font-medium text-muted-foreground">This week</p>
            <CollapsingColumns threshold="26rem" gap="sm">
              {STATS.map((stat) => (
                <Cell key={stat.label} {...stat} />
              ))}
            </CollapsingColumns>
          </aside>
        </div>
      </section>
    </div>
  );
}
