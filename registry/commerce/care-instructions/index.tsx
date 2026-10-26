import type { ComponentProps } from "react";

import { CARE_ORDER, CARE_WORDS, CareSymbol, isKnownCare, type CareCategory, type CareSettings } from "@rhs-ui/commerce/care-instructions/symbols";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export type { CareBleach, CareCategory, CareDry, CareDryClean, CareIron, CareSettings, CareTumbleDry, CareWash } from "@rhs-ui/commerce/care-instructions/symbols";

export interface CareInstructionsProps extends Omit<ComponentProps<"ul">, "children"> {
  /** What the label says: `{ wash: "30", bleach: "no", tumbleDry: "low", iron: "low", dryClean: "no" }`. A setting that is left out, or that is not one of the known values, is skipped and never drawn as something close to it. */
  care: CareSettings;
  /** Symbols with their words under them in a row that wraps, or symbols beside their words in a list. */
  layout?: "row" | "list";
  /** Writes the instruction next to every symbol. Turn it off for a row of symbols on their own: each is then focusable and says its instruction in a tooltip and to a screen reader. A list always shows its words. */
  showLabels?: boolean;
  /** The size of the symbols: 24, 32 or 44px. */
  size?: "sm" | "md" | "lg";
  /** The name of the list for a screen reader. */
  label?: string;
  /** The words, keyed by setting: `{ "wash-30": "Wasmachine, max 30 °C" }`. What you leave out keeps its English words. */
  labels?: Partial<Record<string, string>>;
}

/** The symbol and its tile: a fixed square, so a row of them has one rhythm. The large tile gives up 12px on a phone, so four of them still sit on one line instead of three and an orphan. */
const SIZES = {
  sm: { symbol: 24, tile: "size-9" },
  md: { symbol: 32, tile: "size-12" },
  lg: { symbol: 44, tile: "size-14 sm:size-[4.25rem]" },
} as const;

/**
 * The care label for fashion and home textiles: simple drawn symbols for washing, bleaching, tumble drying, natural
 * drying, ironing and professional care, each with its instruction written out ("Machine wash, max 30 °C"). The
 * symbols are inline SVG on one grid with one stroke, and stay readable at 24px. They are never the only carrier of
 * the meaning: every setting has words, shown beside the symbol or, in a row of bare symbols, said in a tooltip and
 * to a screen reader. A setting this item cannot draw is skipped rather than drawn wrongly, and a label with
 * nothing to show renders nothing.
 */
export function CareInstructions({ care, layout = "row", showLabels = true, size = "md", label = "Care instructions", labels, className, ...props }: CareInstructionsProps) {
  const entries = CARE_ORDER.flatMap((category: CareCategory) => {
    const value = care[category];
    if (value === undefined || !isKnownCare(category, value)) return [];
    const key = `${category}-${value}`;
    return [{ category, value, key, text: labels?.[key] ?? CARE_WORDS[key] ?? value }];
  });
  if (entries.length === 0) return null;

  const spec = SIZES[size];

  if (layout === "list") {
    return (
      <ul data-slot="care-instructions" data-layout="list" aria-label={label} className={cn("divide-y divide-border", className)} {...props}>
        {entries.map((entry) => (
          <li key={entry.key} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
            <span className={cn("grid shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground", spec.tile)}>
              <CareSymbol category={entry.category} value={entry.value} size={spec.symbol} />
            </span>
            <span className="text-sm leading-snug font-medium">{entry.text}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (!showLabels) {
    return (
      <TooltipProvider delayDuration={150}>
        <ul data-slot="care-instructions" data-layout="row" data-labels="false" aria-label={label} className={cn("flex flex-wrap gap-2", className)} {...props}>
          {entries.map((entry) => (
            <li key={entry.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    role="img"
                    aria-label={entry.text}
                    tabIndex={0}
                    className={cn(
                      "grid cursor-default place-items-center rounded-lg border border-border bg-card text-foreground outline-none",
                      "transition-[border-color,box-shadow] duration-150 hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                      spec.tile,
                    )}
                  >
                    <CareSymbol category={entry.category} value={entry.value} size={spec.symbol} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{entry.text}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    );
  }

  return (
    <ul data-slot="care-instructions" data-layout="row" aria-label={label} className={cn("grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3", className)} {...props}>
      {entries.map((entry) => (
        <li key={entry.key} className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 pt-4 pb-3.5 text-center">
          <CareSymbol category={entry.category} value={entry.value} size={spec.symbol} className="text-foreground" />
          <span className="text-xs leading-snug text-balance text-muted-foreground">{entry.text}</span>
        </li>
      ))}
    </ul>
  );
}
