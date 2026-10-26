"use client";

import { useState, type ReactNode } from "react";

import { GradeScale } from "@rhs-ui/commerce/grade-scale";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";

const ENERGY = ["A", "B", "C", "D", "E", "F", "G"] as const;
const ECO = ["A", "B", "C", "D", "E"] as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-0.5">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [grade, setGrade] = useState("C");
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="An energy class on the product page: the best grade is the shortest bar, the marked one is enlarged">
        <Panel title="Halcyon 9 kg washing machine" note="Energy use 0.52 kWh per cycle">
          <GradeScale grades={ENERGY} value={grade} label="Energy class" best="More efficient" worst="Less efficient" />
          <div className="grid gap-2 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Try another class</p>
            <ToggleGroup type="single" value={grade} onValueChange={(next) => (next ? setGrade(next) : undefined)} aria-label="Energy class" size="sm" className="max-w-full flex-wrap">
              {ENERGY.map((item) => (
                <ToggleGroupItem key={item} value={item} aria-label={`Class ${item}`} className="w-8 px-0">
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </Panel>
      </Example>

      <Example caption="An eco score as a row of steps: they grow taller towards the worst grade">
        <Panel title="Kestrel merino jumper" note="Environmental impact of the whole garment">
          <GradeScale orientation="horizontal" grades={ECO} value="B" label="Eco score" best="Lower impact" worst="Higher impact" />
        </Panel>
      </Example>

      <Example caption="Large, for a hero or a printed spec sheet">
        <Panel title="Northwind induction hob">
          <GradeScale size="lg" grades={ENERGY.slice(0, 5)} value="A" label="Energy class" />
        </Panel>
      </Example>

      <Example caption="Small and inline, in a list of products">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
          {[
            { name: "Kestrel handheld vacuum", grade: "B" },
            { name: "Halcyon espresso machine", grade: "D" },
          ].map((product) => (
            <div key={product.name} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="min-w-32 flex-1">
                <p className="text-sm leading-snug font-medium text-pretty">{product.name}</p>
                <p className="text-xs text-muted-foreground">Repairability index</p>
              </div>
              <GradeScale size="sm" orientation="horizontal" grades={ECO} value={product.grade} label="Repairability" className="w-36 shrink-0" />
            </div>
          ))}
        </div>
      </Example>

      <Example caption="Not graded yet: the whole scale, no marker, and a sentence that says so">
        <Panel title="Northwind tower fan" note="Certificate pending from the supplier">
          <GradeScale grades={ENERGY} value="n/a" label="Energy class" />
        </Panel>
      </Example>
    </div>
  );
}
