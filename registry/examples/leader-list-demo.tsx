import type { ReactNode } from "react";

import { LeaderList, type LeaderListItem } from "@rhs-ui/primitives/leader-list";

const MENU: readonly LeaderListItem[] = [
  { id: "cabbage", label: "Charred hispi cabbage", detail: "Whipped ricotta, hazelnut, brown butter", value: "€13" },
  { id: "lamb", label: "Slow-roasted shoulder of lamb with rosemary, anchovy and a salsa verde of capers", detail: "For two, with charred greens", value: "€46" },
  { id: "gnocchi", label: "Potato gnocchi", detail: "Sage, pumpkin, aged pecorino", value: "€19" },
  { id: "trout", label: "Smoked trout", detail: "Pickled cucumber, dill, rye crisp", value: "€16" },
];

const RECEIPT: readonly LeaderListItem[] = [
  { id: "pack", label: "Kestrel 24L daypack, slate", value: "€129.00" },
  { id: "socks", label: "Merino liner socks, 3 pack", value: "€27.00" },
  { id: "tote", label: "Halcyon roll-top tote, natural", value: "€24.50" },
  { id: "shipping", label: "Shipping to Utrecht", value: "Free" },
  { id: "gift", label: "Gift wrap", value: "€3.50" },
  { id: "code", label: "Code HALCYON10", value: "−€18.00" },
  { id: "vat", label: "VAT included (21%)", value: "€28.81" },
  { id: "total", label: <span className="font-semibold">Total paid</span>, value: <span className="font-semibold">€166.00</span> },
];

const SCHEDULE: readonly LeaderListItem[] = [
  { id: "doors", label: "Doors and coffee", value: "08:30" },
  { id: "keynote", label: "Keynote: building for the slowest phone", value: "09:15" },
  { id: "workshop", label: "Workshop: layout that survives a translation", value: "11:00" },
  { id: "lunch", label: "Lunch on the terrace", value: "12:30" },
  { id: "panel", label: "Panel: what we would delete", value: "14:00" },
];

const CONTENTS: readonly LeaderListItem[] = [
  { id: "c1", label: <><span className="me-2.5 text-muted-foreground tabular-nums">1</span>Choosing a pack size</>, value: "9" },
  { id: "c2", label: <><span className="me-2.5 text-muted-foreground tabular-nums">2</span>Fitting the harness</>, value: "24" },
  { id: "c3", label: <><span className="me-2.5 text-muted-foreground tabular-nums">3</span>Packing for three days, and for one</>, value: "41" },
  { id: "c4", label: <><span className="me-2.5 text-muted-foreground tabular-nums">4</span>Repairs in the field</>, value: "68" },
  { id: "c5", label: <><span className="me-2.5 text-muted-foreground tabular-nums">5</span>Index and further reading</>, value: "92" },
];

function Panel({ title, note, children }: { title: string; note: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <h2 className="text-base font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-0.5 mb-5 text-xs text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full gap-5 md:grid-cols-2">
      <Panel title="Dinner menu" note="Halcyon Kitchen, autumn 2026. Descriptions sit under the name.">
        <LeaderList items={MENU} />
      </Panel>
      <Panel title="Your receipt" note="Order 4821, paid by card on 3 November.">
        <LeaderList as="dl" items={RECEIPT} leader="dashes" size="sm" />
      </Panel>
      <Panel title="Saturday schedule" note="Kestrel Summit, Utrecht. One hairline between time and session.">
        <LeaderList as="dl" items={SCHEDULE} leader="line" />
      </Panel>
      <Panel title="Contents" note="Field guide to light packing, third edition.">
        <LeaderList items={CONTENTS} />
      </Panel>
    </div>
  );
}
