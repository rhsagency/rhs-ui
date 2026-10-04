import type { ReactNode } from "react";

import { IconCreditCard, IconDownload } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface BillingInvoice {
  id: string;
  /** Formatted: "1 March 2026". */
  date: string;
  dateTime: string;
  /** Formatted: "€49.00". */
  amount: string;
  status: "paid" | "open" | "failed";
  href: string;
}

export interface BillingSectionProps {
  plan: { name: string; price: string; renews: string };
  /** The card on file: "Visa ending 4242, expires 08/28". */
  paymentMethod: string;
  invoices: readonly BillingInvoice[];
  /** "Change plan", "Cancel" and the like. */
  planActions?: ReactNode;
  onUpdatePayment?: ReactNode;
  className?: string;
}

const STATUS: Record<BillingInvoice["status"], { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-muted text-foreground" },
  open: { label: "Open", className: "border border-border text-foreground" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

/**
 * The billing page of an account: current plan with its renewal date, the
 * payment method, and the invoices as a real table with status in words and
 * a PDF download per row. No amounts invented on the client: you pass them
 * formatted.
 */
export function BillingSection({ plan, paymentMethod, invoices, planActions, onUpdatePayment, className }: BillingSectionProps) {
  return (
    <section data-slot="billing-section" aria-label="Billing" className={cn("grid gap-6", className)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="mt-2 text-2xl font-medium tracking-[-.03em]">{plan.name} <span className="text-base font-normal text-muted-foreground">{plan.price}</span></p>
          <p className="mt-1 text-sm text-muted-foreground">{plan.renews}</p>
          {planActions ? <div className="mt-5 flex flex-wrap gap-2">{planActions}</div> : null}
        </div>
        <div className="rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Payment method</p>
          <p className="mt-2 flex items-center gap-2.5 text-base font-medium"><IconCreditCard className="size-5" />{paymentMethod}</p>
          {onUpdatePayment ? <div className="mt-5">{onUpdatePayment}</div> : null}
        </div>
      </div>
      <div className="relative overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <caption className="px-6 py-4 text-left font-medium">Invoices</caption>
          <thead className="border-y border-border text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-6 py-2.5 text-left font-normal">Date</th>
              <th scope="col" className="px-6 py-2.5 text-left font-normal">Invoice</th>
              <th scope="col" className="px-6 py-2.5 text-right font-normal">Amount</th>
              <th scope="col" className="px-6 py-2.5 text-left font-normal">Status</th>
              <th scope="col" className="px-6 py-2.5"><span className="sr-only">Download</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-3 whitespace-nowrap"><time dateTime={invoice.dateTime}>{invoice.date}</time></td>
                <td className="px-6 py-3 font-mono text-xs whitespace-nowrap">{invoice.id}</td>
                <td className="px-6 py-3 text-right tabular-nums">{invoice.amount}</td>
                <td className="px-6 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs", STATUS[invoice.status].className)}>{STATUS[invoice.status].label}</span></td>
                <td className="px-6 py-3 text-right">
                  <a href={invoice.href} download aria-label={`Download invoice ${invoice.id}`} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconDownload /></a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
