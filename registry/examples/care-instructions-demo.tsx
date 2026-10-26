import type { ReactNode } from "react";

import { CareInstructions, type CareSettings } from "@rhs-ui/commerce/care-instructions";
import { CARE_WORDS, CareSymbol, type CareCategory } from "@rhs-ui/commerce/care-instructions/symbols";

const JUMPER: CareSettings = { wash: "30", bleach: "no", tumbleDry: "no", dry: "flat", iron: "low", dryClean: "p" };
const SHIRT: CareSettings = { wash: "40", bleach: "non-chlorine", tumbleDry: "low", iron: "medium", dryClean: "no" };
const SILK: CareSettings = { wash: "hand", bleach: "no", tumbleDry: "no", dry: "line", iron: "low", dryClean: "wet" };
const LINEN: CareSettings = { wash: "60", bleach: "any", tumbleDry: "normal", iron: "high" };

/** Settings the item cannot draw: a 35 degree wash is not a symbol, and neither is a solvent group nobody has heard of. They are skipped and the rest is drawn. */
const MIXED = { wash: "35", bleach: "no", tumbleDry: "low", iron: "steam", dryClean: "z" } as unknown as CareSettings;

/** Every symbol of the set, one row per kind of instruction. */
const SET: readonly { title: string; category: CareCategory; values: readonly string[] }[] = [
  { title: "Washing", category: "wash", values: ["95", "60", "50", "40", "30", "hand", "no"] },
  { title: "Bleaching", category: "bleach", values: ["any", "non-chlorine", "no"] },
  { title: "Tumble drying", category: "tumbleDry", values: ["low", "normal", "no"] },
  { title: "Natural drying", category: "dry", values: ["line", "drip", "flat"] },
  { title: "Ironing", category: "iron", values: ["low", "medium", "high", "no"] },
  { title: "Professional care", category: "dryClean", values: ["any", "p", "f", "wet", "no"] },
];

function Example({ caption, wide = false, children }: { caption: string; wide?: boolean; children: ReactNode }): React.JSX.Element {
  return (
    <div className={wide ? "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 [grid-column:1/-1]" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3"}>
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
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="A row with the words under each symbol, on a product page: one line when there is room, in twos and threes when there is not" wide>
        <Panel title="Kestrel merino jumper" note="100% merino wool">
          <CareInstructions care={JUMPER} />
        </Panel>
      </Example>

      <Example caption="A list, for a care tab or a sheet that opens from the label">
        <Panel title="Halcyon cotton shirt" note="Machine washable">
          <CareInstructions care={SHIRT} layout="list" />
        </Panel>
      </Example>

      <Example caption="Settings the item cannot draw are skipped, not drawn as something close">
        <Panel title="Imported label" note="Wash 35, a steam iron and a solvent group nobody knows">
          <CareInstructions care={MIXED} layout="list" size="sm" />
        </Panel>
      </Example>

      <Example caption="Symbols on their own, small, for a product card: hover or focus a symbol to read it">
        <Panel title="Northwind silk blouse">
          <CareInstructions care={SILK} showLabels={false} size="sm" />
        </Panel>
      </Example>

      <Example caption="Large, for a printed label or a hero">
        <Panel title="Linen bedding set" note="Hot wash and high heat: it is made for it">
          <CareInstructions care={LINEN} size="lg" showLabels={false} />
        </Panel>
      </Example>

      <Example caption="The whole set, at 32px: drawn as they are, with the words beside them for a screen reader" wide>
        <Panel title="Every symbol">
          <div className="grid gap-3">
            {SET.map((group) => (
              <div key={group.category} className="grid gap-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center">
                <h3 className="text-xs font-medium text-muted-foreground">{group.title}</h3>
                <ul aria-label={group.title} className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const words = CARE_WORDS[`${group.category}-${value}`] ?? value;
                    return (
                      <li key={value} title={words} className="grid size-12 place-items-center rounded-lg border border-border bg-card text-foreground">
                        <CareSymbol category={group.category} value={value} size={32} />
                        <span className="sr-only">{words}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      </Example>
    </div>
  );
}
