"use client";

import { useState } from "react";

import { IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { CountUp } from "@rhs-ui/motion/count-up";

interface Stat {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

const STATS: readonly Stat[] = [
  { label: "Orders shipped", value: 12480 },
  { label: "Payments processed", value: 4.2, decimals: 1, prefix: "$", suffix: "M" },
  { label: "On-time delivery", value: 99.4, decimals: 1, suffix: "%" },
  { label: "Countries served", value: 38 },
];

const LOCALES = [
  { locale: "en-US", note: "1,284,900" },
  { locale: "de-DE", note: "1.284.900" },
  { locale: "en-IN", note: "12,84,900" },
] as const;

export default function Demo(): React.JSX.Element {
  const [run, setRun] = useState(0);
  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Northwind in numbers</h2>
          <p className="mt-1 text-xs text-muted-foreground">Each figure counts once, the first time it is mostly on screen.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
          <IconRefresh />
          Replay
        </Button>
      </div>

      <dl key={run} className="mt-5 grid grid-cols-2 gap-px overflow-clip rounded-xl border border-border bg-border sm:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse justify-end bg-card px-5 py-6">
            <dt className="mt-1.5 text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
              <CountUp value={stat.value} decimals={stat.decimals} prefix={stat.prefix} suffix={stat.suffix} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <h3 className="text-xs font-medium text-muted-foreground">One number, three locales</h3>
        <dl key={`locales-${run}`} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LOCALES.map((item) => (
            <div key={item.locale} className="flex items-baseline justify-between gap-3 rounded-lg border border-border px-4 py-3 sm:block">
              <dt className="font-mono text-xs text-muted-foreground">locale=&quot;{item.locale}&quot;</dt>
              <dd className="text-lg font-medium tracking-[-0.02em] sm:mt-1">
                <CountUp value={1284900} locale={item.locale} duration={1400} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
