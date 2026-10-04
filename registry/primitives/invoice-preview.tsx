import { cn } from "@/lib/utils";

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  /** Unit price in cents. */
  unitPrice: number;
  /** VAT rate as a fraction: 0.21. */
  vat: number;
}

export interface InvoicePreviewProps {
  number: string;
  /** Formatted dates. */
  issued: string;
  due: string;
  from: readonly string[];
  to: readonly string[];
  lines: readonly InvoiceLine[];
  currency?: string;
  locale?: string;
  /** Payment instructions: IBAN, reference. */
  footer?: string;
  className?: string;
}

/**
 * An invoice on screen as it will print: sender and customer, number and
 * dates, the lines as a real table, VAT summed per rate and the total, all
 * worked out in cents from the lines. Paper-white in both themes, because
 * an invoice is a document, and print-friendly as is.
 */
export function InvoicePreview({ number, issued, due, from, to, lines, currency = "EUR", locale = "en-GB", footer, className }: InvoicePreviewProps) {
  const money = new Intl.NumberFormat(locale, { style: "currency", currency });
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const net = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const rates = [...new Set(lines.map((line) => line.vat))].sort((a, b) => b - a);
  const vatPerRate = rates.map((rate) => ({ rate, amount: Math.round(lines.filter((line) => line.vat === rate).reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) * rate) }));
  const total = net + vatPerRate.reduce((sum, row) => sum + row.amount, 0);
  const show = (cents: number) => money.format(cents / 100);
  return (
    <article data-slot="invoice-preview" aria-label={`Invoice ${number}`} className={cn("w-full max-w-2xl rounded-xl border border-[oklch(0.9_0_0)] bg-[oklch(0.995_0_0)] p-8 text-[oklch(0.2_0_0)] shadow-sm sm:p-10", className)}>
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Invoice</h2>
          <p className="mt-1 font-mono text-sm">{number}</p>
        </div>
        <address className="text-right text-sm leading-relaxed not-italic">{from.map((line) => <span key={line} className="block">{line}</span>)}</address>
      </header>
      <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-[oklch(0.5_0_0)] uppercase">Bill to</p>
          <address className="mt-1 leading-relaxed not-italic">{to.map((line) => <span key={line} className="block">{line}</span>)}</address>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:justify-self-end">
          <div className="contents"><dt className="text-[oklch(0.5_0_0)]">Issued</dt><dd>{issued}</dd></div>
          <div className="contents"><dt className="text-[oklch(0.5_0_0)]">Due</dt><dd className="font-medium">{due}</dd></div>
        </dl>
      </div>
      <div className="relative mt-8 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead className="border-b border-[oklch(0.88_0_0)] text-xs text-[oklch(0.5_0_0)]">
            <tr>
              <th scope="col" className="py-2 text-left font-normal">Description</th>
              <th scope="col" className="py-2 pl-4 text-right font-normal">Qty</th>
              <th scope="col" className="py-2 pl-4 text-right font-normal">Price</th>
              <th scope="col" className="py-2 pl-4 text-right font-normal">VAT</th>
              <th scope="col" className="py-2 pl-4 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[oklch(0.93_0_0)]">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="py-2.5 pr-4">{line.description}</td>
                <td className="py-2.5 pl-4 text-right whitespace-nowrap tabular-nums">{line.quantity}</td>
                <td className="py-2.5 pl-4 text-right whitespace-nowrap tabular-nums" suppressHydrationWarning>{show(line.unitPrice)}</td>
                <td className="py-2.5 pl-4 text-right whitespace-nowrap tabular-nums" suppressHydrationWarning>{pct.format(line.vat)}</td>
                <td className="py-2.5 pl-4 text-right whitespace-nowrap tabular-nums" suppressHydrationWarning>{show(line.quantity * line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="mt-6 ml-auto grid max-w-xs grid-cols-2 gap-y-1.5 text-sm">
        <div className="contents"><dt className="text-[oklch(0.5_0_0)]">Subtotal</dt><dd className="text-right tabular-nums" suppressHydrationWarning>{show(net)}</dd></div>
        {vatPerRate.map((row) => (
          <div key={row.rate} className="contents">
            <dt className="text-[oklch(0.5_0_0)]" suppressHydrationWarning>VAT {pct.format(row.rate)}</dt><dd className="text-right tabular-nums" suppressHydrationWarning>{show(row.amount)}</dd>
          </div>
        ))}
        <div className="contents"><dt className="border-t border-[oklch(0.88_0_0)] pt-2 font-medium">Total</dt><dd className="border-t border-[oklch(0.88_0_0)] pt-2 text-right text-base font-medium tabular-nums" suppressHydrationWarning>{show(total)}</dd></div>
      </dl>
      {footer ? <p className="mt-10 border-t border-[oklch(0.9_0_0)] pt-4 text-xs leading-relaxed text-[oklch(0.45_0_0)]">{footer}</p> : null}
    </article>
  );
}
