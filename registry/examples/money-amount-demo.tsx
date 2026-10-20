import type { ReactNode } from "react";

import { MoneyAmount } from "@rhs-ui/primitives/money-amount";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const ACTIVITY = [
  { name: "Northwind Payroll", meta: "Salary, 14 Oct", amount: 325000, direction: "credit" },
  { name: "Halcyon Coffee", meta: "Card payment, 14 Oct", amount: 480, direction: "debit" },
  { name: "Kestrel Air", meta: "Refund for flight KE 204, 13 Oct", amount: 12840, direction: "refund" },
  { name: "Lumen Energy", meta: "Direct debit, 12 Oct", amount: 9612, direction: "debit" },
  { name: "Polder Foods", meta: "Card payment, 12 Oct", amount: 6137, direction: "debit" },
] as const;

const LEDGER = [
  { date: "14 Oct", name: "Northwind Payroll", out: 0, in: 325000 },
  { date: "14 Oct", name: "Halcyon Coffee", out: 480, in: 0 },
  { date: "13 Oct", name: "Kestrel Air refund", out: 0, in: 12840 },
  { date: "12 Oct", name: "Lumen Energy", out: 9612, in: 0 },
] as const;

const CURRENCIES = [
  { caption: "US dollars", locale: "en-US", currency: "USD", amount: -129900 },
  { caption: "Euro, German style", locale: "de-DE", currency: "EUR", amount: -129900 },
  { caption: "Yen: no minor unit", locale: "en-US", currency: "JPY", amount: -129900 },
  { caption: "Kuwaiti dinar: three digits", locale: "en-US", currency: "KWD", amount: -129900 },
] as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="Money in is heard as received, money out as spent, a refund as refunded. Sign and weight carry it, not red and green.">
        <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {ACTIVITY.map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
              </div>
              <MoneyAmount amount={row.amount} currency="EUR" direction={row.direction} className="shrink-0 text-sm" />
            </li>
          ))}
        </ul>
      </Example>

      <Example caption="A ledger with a column for each way: no signs, no symbol, the header says it">
        <div className="relative overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="hidden h-10 px-4 font-medium sm:table-cell">
                  Date
                </th>
                <th scope="col" className="h-10 px-3 font-medium sm:px-4">
                  Description
                </th>
                <th scope="col" className="h-10 px-3 text-right font-medium whitespace-nowrap sm:px-4">
                  Out<span className="max-sm:sr-only"> (EUR)</span>
                </th>
                <th scope="col" className="h-10 px-3 text-right font-medium whitespace-nowrap sm:px-4">
                  In<span className="max-sm:sr-only"> (EUR)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {LEDGER.map((row) => (
                <tr key={`${row.date}-${row.name}`} className="border-b border-border last:border-0">
                  <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground sm:table-cell">{row.date}</td>
                  <td className="px-3 py-3 sm:px-4">{row.name}</td>
                  <td className="px-3 py-3 text-right sm:px-4">
                    {row.out ? <MoneyAmount amount={row.out} currency="EUR" direction="debit" signDisplay="never" showCurrency={false} /> : <span aria-hidden="true">–</span>}
                  </td>
                  <td className="px-3 py-3 text-right sm:px-4">
                    {row.in ? <MoneyAmount amount={row.in} currency="EUR" direction="credit" signDisplay="never" showCurrency={false} /> : <span aria-hidden="true">–</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Example>

      <Example caption="Any currency and locale: the same amount of 129900 minor units, through Intl">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-3">
          {CURRENCIES.map((row) => (
            <div key={row.caption} className="grid gap-1 rounded-xl border border-border bg-card p-4 shadow-xs">
              <p className="text-xs text-muted-foreground">{row.caption}</p>
              <MoneyAmount amount={row.amount} currency={row.currency} locale={row.locale} className="text-lg tracking-[-0.02em]" />
              <p className="font-mono text-[0.6875rem] text-muted-foreground">
                {row.locale} {row.currency}
              </p>
            </div>
          ))}
        </div>
      </Example>
    </div>
  );
}
