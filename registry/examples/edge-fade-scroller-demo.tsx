"use client";

import { useEffect, useRef, useState } from "react";

import { IconArmchair, IconBackpack, IconCoffee, IconFountainPen, IconLamp, IconTent, IconVase } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { EdgeFadeScroller } from "@rhs-ui/motion/edge-fade-scroller";

const FILTERS = ["All rooms", "Lighting", "Seating", "Tables", "Storage", "Rugs", "Mirrors", "Outdoor", "Kitchen", "Bath", "Stationery", "Gifts"] as const;

const VIEWED = [
  { name: "Halcyon desk lamp", icon: <IconLamp /> },
  { name: "Oak lounge chair", icon: <IconArmchair /> },
  { name: "Ceramic vase", icon: <IconVase /> },
  { name: "Two-person tent", icon: <IconTent /> },
  { name: "Day pack, 18 L", icon: <IconBackpack /> },
  { name: "Pour-over set", icon: <IconCoffee /> },
  { name: "Fountain pen", icon: <IconFountainPen /> },
] as const;

const TEAM = [
  { name: "Mara Okafor", role: "Head of Operations" },
  { name: "Joris de Wit", role: "Warehouse lead" },
  { name: "Priya Nair", role: "Customer support" },
  { name: "Tomás Silva", role: "Logistics" },
  { name: "Lena Fischer", role: "Finance" },
  { name: "Ibrahim Yusuf", role: "Engineering" },
  { name: "Sanne Bakker", role: "Purchasing" },
  { name: "Noor Haddad", role: "Design" },
];

const MORE = [
  { name: "Felix Andersson", role: "Returns" },
  { name: "Aiko Tanaka", role: "Quality control" },
  { name: "Daan Visser", role: "Customs" },
  { name: "Chloe Martin", role: "Marketing" },
];

export default function Demo(): React.JSX.Element {
  const [filter, setFilter] = useState("Seating");
  const [people, setPeople] = useState(TEAM);
  const [loading, setLoading] = useState(false);
  const chips = useRef<HTMLDivElement>(null);
  const timer = useRef(0);

  // Open the chip row part-way along, so both edges show a fade.
  useEffect(() => {
    const row = chips.current?.querySelector<HTMLElement>('[data-slot="edge-fade-scroller"]');
    if (row) row.scrollLeft = 96;
    return () => window.clearTimeout(timer.current);
  }, []);

  const loadMore = (): void => {
    if (loading || people.length >= TEAM.length + MORE.length) return;
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setPeople((now) => [...now, ...MORE]);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section aria-labelledby="edge-chips" className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 id="edge-chips" className="text-sm font-medium">
          Filter row
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">A fade shows on each side that has more to scroll.</p>
        <div ref={chips} className="mt-4">
          <EdgeFadeScroller role="group" aria-label="Product categories" className="flex gap-2">
            {FILTERS.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={filter === name}
                onClick={() => setFilter(name)}
                className="inline-flex h-8 shrink-0 items-center rounded-full border border-border bg-background px-3.5 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {name}
              </button>
            ))}
          </EdgeFadeScroller>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filter}</span> from 128 products.
        </p>

        <div className="mt-5 border-t border-border pt-5">
          <h3 className="text-xs font-medium text-muted-foreground">Recently viewed</h3>
          <EdgeFadeScroller role="group" aria-label="Recently viewed products" fadeSize={48} className="mt-3 flex gap-2.5">
            {VIEWED.map((product) => (
              <a
                key={product.name}
                href="#viewed"
                onClick={(event) => event.preventDefault()}
                className="flex w-32 shrink-0 flex-col gap-2 rounded-lg border border-border p-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className="grid size-9 place-items-center rounded-md bg-muted text-muted-foreground [&>svg]:size-4.5" aria-hidden="true">
                  {product.icon}
                </span>
                <span className="text-xs leading-snug font-medium">{product.name}</span>
              </a>
            ))}
          </EdgeFadeScroller>
        </div>
      </section>

      <section aria-labelledby="edge-team" className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 id="edge-team" className="text-sm font-medium">
          Team list
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Vertical, and it asks for more at the end.</p>
        <EdgeFadeScroller orientation="vertical" label="Team members" fadeSize={36} onReachEnd={loadMore} className="mt-4 h-60">
          <ul>
            {people.map((person) => (
              <li key={person.name} className="flex items-center gap-3 py-2">
                <Avatar size="sm">
                  <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{person.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{person.role}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="py-2 text-center text-xs text-muted-foreground" role="status">
            {loading ? "Loading more people..." : people.length >= TEAM.length + MORE.length ? "That is everyone." : "Scroll for more"}
          </p>
        </EdgeFadeScroller>
      </section>
    </div>
  );
}
