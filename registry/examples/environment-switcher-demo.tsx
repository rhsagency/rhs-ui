"use client";

import { useState, type ReactNode } from "react";

import { EnvironmentSwitcher, type Environment } from "@rhs-ui/application/environment-switcher";

export default function Demo(): React.JSX.Element {
  const [id, setId] = useState("staging");
  const [previous, setPrevious] = useState("preview");
  const environment = ENVIRONMENTS.find((item) => item.id === id) ?? ENVIRONMENTS[0];

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-3xl gap-12">
        <Case caption="Switch in the bar of a tool. Development and Staging change at once. Production is drawn as live, with the word on it, and asks first: the dialog names where you are going and what changes, and focus starts on Cancel.">
          <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold tracking-[-0.01em]">Halcyon Console</p>
              <EnvironmentSwitcher environments={ENVIRONMENTS} value={id} onValueChange={setId} align="end" />
            </div>
            <dl className="grid gap-x-8 gap-y-4 px-4 py-5 text-sm sm:grid-cols-3 sm:px-5">
              <Fact term="Connected to" detail={environment?.host ?? ""} mono />
              <Fact term="Last deploy" detail={environment?.deploy ?? ""} />
              <Fact term="Open orders" detail={environment?.orders ?? ""} />
            </dl>
          </div>
        </Case>

        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 sm:items-start">
          <Case caption="Staging asks too, when you list its kind in confirmKinds. A preview is drawn with a dashed ring.">
            <EnvironmentSwitcher environments={ENVIRONMENTS} value={previous} onValueChange={setPrevious} confirmKinds={["staging", "production"]} />
          </Case>
          <Case caption="Turned off, for a moment when the environment cannot be changed, like during a deploy.">
            <EnvironmentSwitcher environments={ENVIRONMENTS} defaultValue="prod" disabled />
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Fact({ term, detail, mono = false }: { term: string; detail: string; mono?: boolean }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-1">
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className={mono ? "truncate font-mono text-[0.8125rem]" : "truncate font-medium"}>{detail}</dd>
    </div>
  );
}

interface Detailed extends Environment {
  host: string;
  deploy: string;
  orders: string;
}

const ENVIRONMENTS: readonly Detailed[] = [
  { id: "dev", name: "Development", kind: "development", description: "Your own machine and shared test data", host: "localhost:4000", deploy: "Today, 09:12", orders: "3 test orders" },
  { id: "preview", name: "Preview", kind: "preview", description: "One per pull request, then removed", host: "pr-418.halcyon.dev", deploy: "Yesterday, 17:40", orders: "No orders" },
  { id: "staging", name: "Staging", kind: "staging", description: "Production-like, with anonymised data", host: "api.staging.halcyon.dev", deploy: "Mon 19 Oct, 14:05", orders: "12 test orders" },
  {
    id: "prod",
    name: "Production",
    kind: "production",
    description: "Real customers and real money",
    consequence: "Orders you create or refund here are real, and the customer is emailed straight away.",
    host: "api.halcyon.dev",
    deploy: "Thu 15 Oct, 10:30",
    orders: "47 open orders",
  },
];
