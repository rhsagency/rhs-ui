"use client";

import { useState, type ReactNode } from "react";

import { IconShield } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { MaskedValue } from "@rhs-ui/primitives/masked-value";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const DETAILS = [
  { key: "email", term: "Email", value: "marit.devries@northwind.example", mask: "email" as const },
  { key: "phone", term: "Phone", value: "+31 6 1234 5678", mask: "phone" as const },
  { key: "card", term: "Card", value: "4242 4242 4242 4242", mask: "card" as const, timed: true },
  { key: "iban", term: "IBAN", value: "NL91 ABNA 0417 1643 00", mask: "iban" as const },
  { key: "secret", term: "Secret key", value: "sk_live_demo_0000_not_a_real_key_4d2e", mask: (value: string) => `${value.slice(0, 8)}${"•".repeat(10)}${value.slice(-4)}`, label: "secret key" },
] as const;

type Key = (typeof DETAILS)[number]["key"];

function Row({ term, children }: { term: string; children: ReactNode }): React.JSX.Element {
  return (
    // The label stands over the value on a phone, where a side column leaves too little room for a long mask.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-y-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center sm:gap-x-4 sm:gap-y-0">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // The card starts shown, so the countdown on its button can be seen: it hides itself after ten seconds.
  const [shown, setShown] = useState<Record<Key, boolean>>({ email: false, phone: false, card: true, iban: false, secret: false });
  const [asked, setAsked] = useState(0);
  const all = Object.values(shown).every(Boolean);

  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Hidden until asked: each button is named “Show email” and says whether it is pressed. The card starts shown and hides itself after ten seconds, counted down on its button">
        <div className="max-w-xl rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Billing contact</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = !all;
                setShown({ email: next, phone: next, card: next, iban: next, secret: next });
                if (next) setAsked((count) => count + DETAILS.length);
              }}
            >
              {all ? "Hide all" : "Show all"}
            </Button>
          </div>
          <dl className="divide-y divide-border px-4 text-sm">
            {DETAILS.map((detail) => (
              <Row key={detail.key} term={detail.term}>
                <MaskedValue
                  value={detail.value}
                  mask={detail.mask}
                  label={"label" in detail ? detail.label : undefined}
                  autoHideAfter={"timed" in detail ? 10 : undefined}
                  revealed={shown[detail.key]}
                  onRevealedChange={(next) => setShown((now) => ({ ...now, [detail.key]: next }))}
                  onReveal={() => setAsked((count) => count + 1)}
                  className={detail.key === "email" || detail.key === "phone" ? undefined : "font-mono text-[0.8125rem]"}
                />
              </Row>
            ))}
          </dl>
          <p className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground tabular-nums">
            <IconShield aria-hidden="true" className="size-3.5" />
            Reveals logged this session: {asked}
          </p>
        </div>
      </Example>

      <Example caption="For someone who may not see it: without a reveal button there is only the mask, and a screen reader hears that it is hidden">
        <dl className="max-w-sm divide-y divide-border rounded-xl border border-border bg-card px-4 text-sm shadow-xs">
          <Row term="Email">
            <MaskedValue value="marit.devries@northwind.example" mask="email" revealable={false} />
          </Row>
          <Row term="Card">
            <MaskedValue value="4242 4242 4242 4242" mask="card" revealable={false} className="font-mono text-[0.8125rem]" />
          </Row>
        </dl>
      </Example>
    </div>
  );
}
