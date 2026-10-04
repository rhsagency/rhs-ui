import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TicketStubProps {
  /** "Calm Software Summit 2026". */
  event: string;
  /** Who it is for. */
  holder: string;
  /** Facts in the stub: "Date", "Gate", "Seat". */
  details: readonly { label: string; value: string }[];
  /** The ticket code, printed and given to the code slot. */
  code: string;
  /** A QR code or barcode you render from the code. */
  scan?: ReactNode;
  className?: string;
}

/**
 * A ticket that looks like one: the event and holder on the left, the facts
 * in a grid, a perforated tear line with notches, and the stub with the scan
 * code and the printed code for manual entry. For confirmation pages and
 * wallets; a definition list underneath, so it reads well without the art.
 */
export function TicketStub({ event, holder, details, code, scan, className }: TicketStubProps) {
  return (
    <article data-slot="ticket-stub" aria-label={`Ticket for ${event}`} className={cn("relative flex w-full max-w-xl flex-col overflow-clip rounded-3xl border border-border bg-background sm:flex-row", className)}>
      <div className="flex-1 p-6">
        <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">Admit one</p>
        <h3 className="mt-2 text-xl font-medium tracking-tight text-balance">{event}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{holder}</p>
        <dl className="mt-5 grid grid-cols-3 gap-4">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className="text-[11px] text-muted-foreground uppercase">{detail.label}</dt>
              <dd className="mt-0.5 text-sm font-medium">{detail.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div aria-hidden="true" className="relative h-px border-t-2 border-dashed border-border sm:h-auto sm:w-px sm:border-t-0 sm:border-l-2">
        <span className="absolute -top-3 -left-3 size-6 rounded-full border border-border bg-background sm:-top-3 sm:-left-3" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full border border-border bg-background sm:top-auto sm:-bottom-3 sm:left-[-13px]" />
      </div>
      <div className="flex flex-col items-center justify-center gap-3 p-6 sm:w-44">
        {scan ? <div className="size-28 [&_svg]:size-full">{scan}</div> : null}
        <p className="font-mono text-xs tracking-widest">{code}</p>
      </div>
    </article>
  );
}
