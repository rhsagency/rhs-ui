"use client";

import { useMemo, useRef, useState } from "react";

import { MapPanelShell, type MapPanelSnap } from "@rhs-ui/application/map-panel-shell";
import { IconArmchair, IconClock, IconLeaf, IconLocate, IconMinus, IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Chip } from "@rhs-ui/primitives/chip";
import { IconButton } from "@rhs-ui/primitives/icon-button";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { Separator } from "@rhs-ui/primitives/separator";
import { cn } from "@/lib/utils";

type Perk = "seating" | "oat";

interface Store {
  id: string;
  name: string;
  street: string;
  distance: string;
  /** Written out: "Open until 18:00" and "Closed, opens 08:00". */
  hours: string;
  open: boolean;
  perks: readonly Perk[];
  /** Where the pin stands on the map, in px from the centre of the map. */
  at: readonly [x: number, y: number];
}

const STORES: readonly Store[] = [
  { id: "oude-haven", name: "Larkspur Coffee, Oude Haven", street: "Wijnhaven 12", distance: "0.3 km", hours: "Open until 18:00", open: true, perks: ["seating", "oat"], at: [-60, -230] },
  { id: "markthal", name: "Larkspur Coffee, Markthal", street: "Verlengde Nieuwstraat 40", distance: "0.6 km", hours: "Open until 20:00", open: true, perks: ["oat"], at: [80, -170] },
  { id: "witte-de-with", name: "Larkspur Coffee, Witte de Withstraat", street: "Witte de Withstraat 77", distance: "0.9 km", hours: "Closed, opens 08:00", open: false, perks: ["seating"], at: [-130, -120] },
  { id: "katendrecht", name: "Larkspur Roastery, Katendrecht", street: "Deliplein 5", distance: "1.4 km", hours: "Open until 17:00", open: true, perks: ["seating", "oat"], at: [110, -300] },
  { id: "station-zuid", name: "Larkspur Coffee, Station Zuid", street: "Zuidplein 2", distance: "1.8 km", hours: "Open until 19:00", open: true, perks: [], at: [-20, -80] },
  { id: "kralingen", name: "Larkspur Coffee, Kralingen", street: "Lusthofstraat 18", distance: "2.6 km", hours: "Closed, opens 08:30", open: false, perks: ["seating", "oat"], at: [320, -90] },
  { id: "delfshaven", name: "Larkspur Coffee, Delfshaven", street: "Voorhaven 31", distance: "3.1 km", hours: "Open until 18:30", open: true, perks: ["seating"], at: [-120, 210] },
  { id: "hoogvliet", name: "Larkspur Coffee, Hoogvliet", street: "Binnenban 9", distance: "5.2 km", hours: "Open until 21:00", open: true, perks: ["oat"], at: [300, 270] },
];

// Every chip carries an icon: a selected chip swaps it for a check, so selecting never changes a chip's width and the row never shifts.
const FILTERS: readonly { id: "open" | Perk; label: string; icon: React.JSX.Element }[] = [
  { id: "open", label: "Open now", icon: <IconClock /> },
  { id: "seating", label: "Seating", icon: <IconArmchair /> },
  { id: "oat", label: "Oat milk", icon: <IconLeaf /> },
];

const CENTER = { x: 1200, y: 800 } as const;

/** A quiet city drawn in the page's own tones: blocks, two avenues, a river and a park. It is decoration: the pins and the list carry the meaning. */
function CityMap(): React.JSX.Element {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 2400 1600" className="absolute inset-0 size-full">
      <defs>
        <pattern id="mp-blocks" width="132" height="104" patternUnits="userSpaceOnUse">
          <rect x="8" y="8" width="116" height="88" rx="12" className="fill-background" />
        </pattern>
        <pattern id="mp-park" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.6" className="fill-foreground/25" />
        </pattern>
      </defs>
      <rect width="2400" height="1600" className="fill-muted" />
      <rect width="2400" height="1600" fill="url(#mp-blocks)" />
      <path d="M-100 1150 C 400 1100 800 1250 1300 1180 S 2100 1070 2500 1150" fill="none" className="stroke-foreground/10" strokeWidth="76" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-200 1380 L 760 880 L 1500 640 L 2600 120" className="stroke-border" strokeWidth="34" />
        <path d="M1620 -100 L 1330 700 L 1000 1000 L 500 1800" className="stroke-border" strokeWidth="34" />
        <path d="M-200 1380 L 760 880 L 1500 640 L 2600 120" className="stroke-muted" strokeWidth="28" />
        <path d="M1620 -100 L 1330 700 L 1000 1000 L 500 1800" className="stroke-muted" strokeWidth="28" />
      </g>
      <rect x="1260" y="860" width="300" height="180" rx="26" className="fill-background stroke-border" strokeWidth="2" />
      <rect x="1260" y="860" width="300" height="180" rx="26" fill="url(#mp-park)" />
      <g className="fill-muted-foreground" fontSize="20" fontWeight="600" letterSpacing="5">
        <text x="1030" y="760">
          OLD HARBOUR
        </text>
        <text x="1100" y="1100">
          MARKET QUARTER
        </text>
        <text x="1410" y="958" textAnchor="middle">
          PARK
        </text>
      </g>
    </svg>
  );
}

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<string>("oude-haven");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ReadonlySet<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState<MapPanelSnap>("half");
  const rows = useRef<Map<string, HTMLButtonElement>>(new Map());

  const shown = useMemo(
    () =>
      STORES.filter(
        (store) =>
          (query.trim() === "" || `${store.name} ${store.street}`.toLowerCase().includes(query.trim().toLowerCase())) &&
          (!filters.has("open") || store.open) &&
          (["seating", "oat"] as const).every((perk) => !filters.has(perk) || store.perks.includes(perk)),
      ),
    [query, filters],
  );

  function choose(id: string) {
    setSelected(id);
    // On a phone a peeking sheet rises to show the store that was picked.
    setSnap((current) => (current === "peek" ? "half" : current));
    // The row that goes with the chosen pin comes into view. Only when someone chose: scrolling a row into view on load would move the keyboard's starting point past the search.
    requestAnimationFrame(() => rows.current.get(id)?.scrollIntoView({ block: "nearest" }));
  }

  return (
    <MapPanelShell
      snap={snap}
      onSnapChange={setSnap}
      labels={{ panel: "Stores", show: "Show stores", hide: "Hide stores", expand: "Show more stores", collapse: "Show fewer stores", resize: "Resize the list of stores" }}
      canvas={
        <div className="absolute inset-0 overflow-hidden">
          {/* Where the panel floats beside the map, the map is centred in the room it leaves: half of the 24rem panel and its margin, to the right. */}
          <div
            className="absolute top-1/2 left-1/2 h-[1600px] w-[2400px] transition-transform duration-300 motion-reduce:transition-none [--dir:1] rtl:[--dir:-1] @3xl:[--shift:calc(12.5rem*var(--dir))]"
            style={{ transform: `translate(calc(-50% + var(--shift, 0px)), -50%) scale(${zoom})` }}
          >
            <CityMap />
            {STORES.map((store, index) => {
              const on = store.id === selected;
              const visible = shown.some((item) => item.id === store.id);
              return (
                <button
                  key={store.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${store.name}, ${store.distance}`}
                  tabIndex={visible ? 0 : -1}
                  onClick={() => choose(store.id)}
                  className={cn(
                    "group/pin absolute grid place-items-center rounded-full border-2 text-xs font-semibold tabular-nums outline-none transition-[width,height,opacity] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                    "after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-[5px] after:border-t-[7px] after:border-x-transparent after:content-['']",
                    on ? "z-10 size-10 border-foreground bg-background text-foreground after:border-t-foreground" : "size-8 border-background bg-foreground text-background after:border-t-foreground",
                    !visible && "pointer-events-none opacity-0",
                  )}
                  style={{ left: CENTER.x + store.at[0], top: CENTER.y + store.at[1], transform: `translate(-50%, calc(-100% - 7px)) scale(${1 / zoom})`, transformOrigin: "50% 100%" }}
                >
                  {index + 1}
                  {on ? <span className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium whitespace-nowrap text-card-foreground shadow-sm">{store.name}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      }
      controls={
        <>
          <div role="group" aria-label="Zoom" className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs">
            <IconButton icon={<IconPlus />} label="Zoom in" side="left" className="rounded-none" disabled={zoom >= 1.5} onClick={() => setZoom((value) => Math.min(1.5, Math.round((value + 0.25) * 100) / 100))} />
            <Separator />
            <IconButton icon={<IconMinus />} label="Zoom out" side="left" className="rounded-none" disabled={zoom <= 0.75} onClick={() => setZoom((value) => Math.max(0.75, Math.round((value - 0.25) * 100) / 100))} />
          </div>
          <IconButton icon={<IconLocate />} label="Back to the centre" side="left" variant="outline" className="bg-card shadow-xs" onClick={() => setZoom(1)} />
        </>
      }
      search={<SearchInput aria-label="Search stores" placeholder="Search by name or street" value={query} onValueChange={setQuery} />}
      filters={FILTERS.map((filter) => (
        <Chip
          key={filter.id}
          variant="toggle"
          icon={filter.icon}
          selected={filters.has(filter.id)}
          onSelectedChange={(on) =>
            setFilters((current) => {
              const next = new Set(current);
              if (on) next.add(filter.id);
              else next.delete(filter.id);
              return next;
            })
          }
        >
          {filter.label}
        </Chip>
      ))}
      panel={
        <div>
          <p role="status" className="px-4 pt-3 pb-1 text-xs text-muted-foreground tabular-nums">
            {shown.length === 0 ? "No stores match" : `${shown.length} ${shown.length === 1 ? "store" : "stores"} near Rotterdam Centraal`}
          </p>
          {shown.length === 0 ? (
            <div className="grid justify-items-start gap-3 px-4 py-4 text-sm text-muted-foreground">
              Clear a filter or try another street.
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setFilters(new Set());
                }}
              >
                Clear search and filters
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-0.5 p-1.5">
              {shown.map((store) => {
                const number = STORES.findIndex((item) => item.id === store.id) + 1;
                return (
                  <li key={store.id}>
                    <button
                      ref={(element) => {
                        if (element) rows.current.set(store.id, element);
                        else rows.current.delete(store.id);
                      }}
                      type="button"
                      aria-current={store.id === selected ? "true" : undefined}
                      onClick={() => choose(store.id)}
                      className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-start outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=true]:bg-muted motion-reduce:transition-none"
                    >
                      <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background tabular-nums">
                        {number}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{store.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{store.street}</span>
                        <span className={cn("mt-1.5 flex items-center gap-1.5 text-xs", store.open ? "font-medium text-foreground" : "text-muted-foreground")}>
                          <IconClock aria-hidden="true" className="size-3.5 shrink-0" />
                          {store.hours}
                        </span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">{store.distance}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      }
    />
  );
}
