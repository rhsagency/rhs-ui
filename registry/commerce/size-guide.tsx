"use client";

import { useState } from "react";

import { IconRuler } from "@rhs-ui/icons";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";

export interface SizeGuideProps {
  /** Column headings after the size: "Chest", "Waist", "Length". */
  measures: readonly string[];
  /** One row per size, measurements in centimetres in the order of measures. */
  sizes: readonly { size: string; cm: readonly number[] }[];
  /** How to measure, one line each. */
  howTo?: readonly string[];
  triggerLabel?: string;
}

/**
 * "Which size am I?" in a dialog: the chart in centimetres or inches with a
 * switch, how to measure, and the size column as row headers so a screen
 * reader names the size for every number.
 */
export function SizeGuide({ measures, sizes, howTo = [], triggerLabel = "Size guide" }: SizeGuideProps) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const show = (cm: number) => (unit === "cm" ? String(cm) : (cm / 2.54).toFixed(1));
  return (
    <Dialog>
      <DialogTrigger data-slot="size-guide" className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 outline-none hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconRuler />{triggerLabel}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Size guide</DialogTitle>
          <DialogDescription>Measurements of the body, not of the garment.</DialogDescription>
        </DialogHeader>
        <SegmentedControl label="Unit" value={unit} onValueChange={(value) => setUnit(value as "cm" | "in")} options={[{ value: "cm", label: "Centimetres" }, { value: "in", label: "Inches" }]} />
        <div className="relative overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr><th scope="col" className="px-4 py-2 font-normal">Size</th>{measures.map((measure) => <th key={measure} scope="col" className="px-4 py-2 font-normal">{measure} ({unit})</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sizes.map((row) => (
                <tr key={row.size}>
                  <th scope="row" className="px-4 py-2 text-left font-medium">{row.size}</th>
                  {row.cm.map((value, index) => <td key={index} className="px-4 py-2 tabular-nums">{show(value)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {howTo.length ? (
          <ul className="space-y-1.5 text-sm text-muted-foreground">{howTo.map((line) => <li key={line}>· {line}</li>)}</ul>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
