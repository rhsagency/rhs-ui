"use client";

import { useState } from "react";

import { BalanceCard } from "@rhs-ui/dashboard/balance-card";
import { IconArrowUp, IconPlus } from "@rhs-ui/icons";

const PENDING = 1250.5;

export default function Demo(): React.JSX.Element {
  const [balance, setBalance] = useState(12480.5);
  const [hidden, setHidden] = useState(false);

  return (
    <div className="grid w-full max-w-4xl items-start gap-x-8 gap-y-10 md:grid-cols-2">
      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">Withdraw and top up move the balance. The eye hides every figure.</p>
        <BalanceCard
          balance={balance}
          available={balance - PENDING}
          pending={PENDING}
          currency="EUR"
          locale="en-IE"
          nextPayout={{ date: "2026-10-23", amount: 2100 }}
          hidden={hidden}
          onToggleHidden={setHidden}
          actions={[
            { label: "Withdraw", icon: <IconArrowUp />, onClick: () => setBalance((current) => current - 5000) },
            { label: "Top up", icon: <IconPlus />, onClick: () => setBalance((current) => current + 2500) },
          ]}
        />
      </section>

      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">Overdrawn is written out, with a minus sign</p>
        <BalanceCard
          balance={-320}
          available={-320}
          pending={0}
          currency="EUR"
          locale="en-IE"
          title="Kestrel Pay account"
          nextPayout={{ date: "2026-10-27", amount: 640 }}
          actions={[{ label: "Top up", icon: <IconPlus /> }, { label: "Statement", variant: "outline" }]}
        />
      </section>

      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">Starts hidden, for a shared screen</p>
        <BalanceCard
          balance={48215.9}
          available={46000}
          pending={2215.9}
          currency="EUR"
          locale="en-IE"
          title="Marketplace earnings"
          defaultHidden
          nextPayout={{ date: "2026-10-30" }}
          actions={[{ label: "Withdraw", icon: <IconArrowUp /> }]}
        />
      </section>

      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">Loading, in the same footprint</p>
        <BalanceCard balance={0} loading />
      </section>
    </div>
  );
}
