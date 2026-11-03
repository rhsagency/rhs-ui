"use client";

import { useState, type ReactNode } from "react";

import { InlineList } from "@rhs-ui/primitives/inline-list";
import { Label } from "@rhs-ui/primitives/label";
import { Slider } from "@rhs-ui/primitives/slider";

const LINK = "rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40";

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
      {note ? <p className="mt-0.5 text-xs text-muted-foreground">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [width, setWidth] = useState(330);
  return (
    <div className="grid w-full gap-5">
      <div className="grid gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
        <Label htmlFor="inline-list-width" className="text-sm">
          Width of the line
        </Label>
        <Slider id="inline-list-width" thumbLabels={["Width in pixels"]} min={160} max={560} step={10} value={[width]} onValueChange={([next]) => setWidth(next ?? 330)} />
        <p className="text-sm text-muted-foreground tabular-nums sm:w-14 sm:text-end">{width}px</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="A text separator" note="A dot typed between the words goes wherever the line breaks.">
          <p className="max-w-full border-x border-dashed border-border px-3 text-sm leading-6 text-muted-foreground" style={{ width }}>
            By&nbsp;Maya&nbsp;Chen · 12&nbsp;October&nbsp;2026 · 8&nbsp;min&nbsp;read · Field&nbsp;notes
          </p>
        </Card>
        <Card title="Inline list" note="The same four facts. The dot lives in the space, so a break takes it away.">
          <div className="max-w-full border-x border-dashed border-border px-3" style={{ width }}>
            <InlineList>
              <span>By Maya Chen</span>
              <span>12 October 2026</span>
              <span>8 min read</span>
              <span>Field notes</span>
            </InlineList>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card title="Legal links" note="Centred, pipes, kept as a list.">
          <div className="mx-auto max-w-[15rem]">
            <InlineList as="ul" separator="pipe" align="center" size="xs" gap="lg">
              <a className={LINK} href="#privacy">Privacy</a>
              <a className={LINK} href="#terms">Terms</a>
              <a className={LINK} href="#cookies">Cookies</a>
              <a className={LINK} href="#status">Status</a>
              <a className={LINK} href="#accessibility">Accessibility</a>
            </InlineList>
          </div>
        </Card>
        <Card title="Listing facts" note="Slashes, set to the end.">
          <div className="ms-auto max-w-[14rem]">
            <InlineList separator="slash" align="end">
              <span>3 bedrooms</span>
              <span>2 baths</span>
              <span>142 m²</span>
              <span>Built 1932</span>
              <span>Energy label B</span>
            </InlineList>
          </div>
        </Card>
        <Card title="Only space" note="No mark, but a break still lands between items.">
          <div className="max-w-[14rem]">
            <InlineList separator="none" gap="lg">
              <span>Halcyon Studio</span>
              <span>Rotterdam</span>
              <span>Est. 2014</span>
              <span>14 people</span>
            </InlineList>
          </div>
        </Card>
      </div>
    </div>
  );
}
