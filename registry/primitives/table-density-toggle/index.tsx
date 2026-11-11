"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { Glyph } from "@rhs-ui/icons";
import { DEFAULT_DENSITY, DENSITIES, isDensity, type TableDensity } from "@rhs-ui/primitives/table-density-toggle/density";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export type { TableDensity } from "@rhs-ui/primitives/table-density-toggle/density";

export interface TableDensityOptions {
  /** The density, when you control it. Pair it with `onValueChange`. */
  value?: TableDensity;
  /** The density to start with, when you do not control it. Default "comfortable". */
  defaultValue?: TableDensity;
  /** Called with the new density whenever the person picks one. */
  onValueChange?: (value: TableDensity) => void;
  /** Remember the choice in this localStorage key, so the next visit starts where this one ended. The server and the first render use `defaultValue`; the stored choice is applied right after. Other tabs follow. */
  storageKey?: string;
}

export interface TableDensityProviderProps extends TableDensityOptions {
  /** The tables, and wherever the control sits. */
  children: ReactNode;
}

/** The words the control says, for another language or your own wording. */
export interface TableDensityLabels {
  /** The name of the group of three. Default "Row density". */
  group: string;
  /** The name and tooltip of the first button. Default "Compact rows". */
  compact: string;
  /** The name and tooltip of the second button. Default "Comfortable rows". */
  comfortable: string;
  /** The name and tooltip of the third button. Default "Spacious rows". */
  spacious: string;
}

/** Anything else a `div` takes (`id`, `className`, `style`, `aria-describedby`, `data-*`) goes to the group of three. */
export interface TableDensityToggleProps extends TableDensityOptions, Omit<ComponentProps<"div">, keyof TableDensityOptions | "onChange" | "children" | "dir"> {
  /** The reading direction, which sets what the left and right arrow keys do. Default: the page's. */
  dir?: "ltr" | "rtl";
  /** The words the control says, for translation. */
  labels?: Partial<TableDensityLabels>;
}

interface DensityContextValue {
  density: TableDensity;
  setDensity: (density: TableDensity) => void;
}

const DensityContext = createContext<DensityContextValue | null>(null);

// localStorage is an external store: the server and the first render read nothing from it, the browser reads it right after, and a write in this tab or another reaches everyone listening.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function readStored(key: string | undefined): TableDensity | null {
  if (!key) return null;
  try {
    const stored = window.localStorage.getItem(key);
    return isDensity(stored) ? stored : null;
  } catch {
    return null;
  }
}

function useDensityState({ value, defaultValue = DEFAULT_DENSITY, onValueChange, storageKey }: TableDensityOptions): DensityContextValue {
  const [own, setOwn] = useState<TableDensity>(defaultValue);
  const stored = useSyncExternalStore(
    subscribe,
    () => readStored(storageKey),
    () => null,
  );
  const density = value ?? stored ?? own;
  function setDensity(next: TableDensity) {
    if (value === undefined) setOwn(next);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // Storage is blocked or full: the choice still holds for this visit.
      }
      for (const listener of listeners) listener();
    }
    onValueChange?.(next);
  }
  return { density, setDensity };
}

// The sizes every table cell below takes from the data-density attribute. They are descendant selectors, so they reach any table (this kit's Table or a raw <table>) and beat the cell's own padding classes. Only spacing and the size of the text change.
// A cell that sets its own height and padding (a panel, a message that spans the table) says so with data-density-skip and keeps them, and so does everything inside it: every rule below stops at that boundary with
// :not([data-density-skip],[data-density-skip]_*), which leaves out a skipped cell and any cell below one, so a table nested in a panel keeps its own sizes. The classes are written out in full because Tailwind reads them as text.
const SIZES = cn(
  "data-[density=compact]:[--row-height:2rem] data-[density=compact]:[--head-height:2rem] data-[density=compact]:[--row-text:0.8125rem]",
  "data-[density=comfortable]:[--row-height:2.75rem] data-[density=comfortable]:[--head-height:2.5rem] data-[density=comfortable]:[--row-text:0.875rem]",
  "data-[density=spacious]:[--row-height:3.5rem] data-[density=spacious]:[--head-height:3rem] data-[density=spacious]:[--row-text:0.9375rem]",
  "[&_td:not([data-density-skip],[data-density-skip]_*)]:h-(--row-height) [&_td:not([data-density-skip],[data-density-skip]_*)]:py-0 [&_td:not([data-density-skip],[data-density-skip]_*)]:[font-size:var(--row-text)] [&_td:not([data-density-skip],[data-density-skip]_*)]:leading-snug",
  "[&_tbody_th:not([data-density-skip],[data-density-skip]_*)]:h-(--row-height) [&_tbody_th:not([data-density-skip],[data-density-skip]_*)]:py-0 [&_tfoot_th:not([data-density-skip],[data-density-skip]_*)]:h-(--row-height) [&_tfoot_th:not([data-density-skip],[data-density-skip]_*)]:py-0",
  "[&_thead_th:not([data-density-skip],[data-density-skip]_*)]:h-(--head-height) [&_thead_th:not([data-density-skip],[data-density-skip]_*)]:py-0 [&_th:not([data-density-skip],[data-density-skip]_*)]:[font-size:var(--row-text)]",
);

/**
 * Holds how tight a table's rows are and hands it to every table below it with no props passed down. It renders a wrapper
 * with `display: contents` that carries `data-density`, and every cell under it takes its height and the size of its text
 * from that attribute: 32px rows with 13px text when compact, 44px with 14px when comfortable, 56px with 15px when
 * spacious. It works with the RHS UI Table and with a plain `<table>`. Density changes spacing only, never what a table
 * shows. A cell marked `data-density-skip` (a detail panel, a message that spans the table) keeps its own height and
 * padding, and so does every table inside it. Control it with `value` and `onValueChange`, or leave it alone, and pass
 * `storageKey` to remember the choice.
 */
export function TableDensityProvider({ children, ...options }: TableDensityProviderProps) {
  const state = useDensityState(options);
  return (
    <DensityContext.Provider value={state}>
      <div data-slot="table-density" data-density={state.density} className={cn("contents", SIZES)}>
        {children}
      </div>
    </DensityContext.Provider>
  );
}

/** The density and its setter, for a cell or a control of your own: an avatar that shrinks in a compact table. Outside a provider it reports "comfortable" and ignores the setter. */
export function useTableDensity(): DensityContextValue {
  return useContext(DensityContext) ?? { density: DEFAULT_DENSITY, setDensity: () => undefined };
}

const DEFAULT_LABELS = {
  group: "Row density",
  compact: "Compact rows",
  comfortable: "Comfortable rows",
  spacious: "Spacious rows",
} satisfies TableDensityLabels;

/**
 * Lines for rows: five close together, three, two far apart. The number of lines and the gap between them tell the three apart
 * before any word does, also at the 18px they are drawn at, where five lines against four (or a gap of 4 against 5) is the same grey stack.
 * The lines sit on whole pixels at that size (a 24 grid drawn at three quarters), so no line is softer than the next.
 */
const DRAWINGS = {
  compact: "M4 3.33h16M4 7.33h16M4 11.33h16M4 15.33h16M4 19.33h16",
  comfortable: "M4 3.33h16M4 11.33h16M4 19.33h16",
  spacious: "M4 6h16M4 16.67h16",
} as const;

/**
 * Three icon buttons that pick the density of the tables below: compact, comfortable or spacious. It is one radio
 * group, so Tab enters it once and the arrow keys move and choose; every button has a name and a tooltip with the same words.
 * Inside a `TableDensityProvider` it reads and sets the provider's density. On its own it keeps a density of its
 * own, with the same `value`, `defaultValue`, `onValueChange` and `storageKey`, so you can drive your own tables from it.
 */
export function TableDensityToggle({ className, labels, value, defaultValue, onValueChange, storageKey, ...props }: TableDensityToggleProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const own = useDensityState({ value, defaultValue, onValueChange, storageKey });
  const { density, setDensity } = useContext(DensityContext) ?? own;
  return (
    <TooltipProvider delayDuration={300}>
      <RadioGroupPrimitive.Root
        {...props}
        data-slot="table-density-toggle"
        aria-label={words.group}
        value={density}
        onValueChange={(next) => {
          if (isDensity(next)) setDensity(next);
        }}
        className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5", className)}
      >
        {DENSITIES.map((item) => (
          <Tooltip key={item}>
            <TooltipTrigger
              asChild
              onClick={(event) => {
                // An arrow key moves the focus to a button and the radio group then presses it for you: a click with no pointer (detail 0). A tooltip closes on a press, and the
                // label the focus has just opened would shut at once, so a keyboard user would never see it. Such a click does not close it; a press with a mouse still does.
                if (event.detail === 0) event.preventDefault();
              }}
            >
              {/* The tooltip belongs to a wrapper, not to the radio: the radio runs its own click handler first, and only then does the press reach the tooltip, which can decide to keep the label. */}
              <span className="inline-flex">
                <RadioGroupPrimitive.Item
                  value={item}
                  aria-label={words[item]}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-[background-color,color,box-shadow] duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-xs motion-reduce:transition-none"
                >
                  <Glyph d={DRAWINGS[item]} size={18} />
                </RadioGroupPrimitive.Item>
              </span>
            </TooltipTrigger>
            <TooltipContent>{words[item]}</TooltipContent>
          </Tooltip>
        ))}
      </RadioGroupPrimitive.Root>
    </TooltipProvider>
  );
}
