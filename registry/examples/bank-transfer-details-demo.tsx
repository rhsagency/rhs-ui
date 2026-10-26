"use client";

import { useState, type ReactNode } from "react";

import { BankTransferDetails, type BankTransferAccount, type BankTransferField } from "@rhs-ui/commerce/bank-transfer-details";

const NORTHWIND: BankTransferAccount = { beneficiary: "Northwind Goods B.V.", iban: "NL65 MRDN 0417 1643 00", bic: "MRDNNL2A", amount: 12900, reference: "NW-20431" };
const KESTREL: BankTransferAccount = { beneficiary: "Kestrel Outdoor GmbH", iban: "DE89370400440532013000", amount: 8995, reference: "KO-5528-17" };
const HALCYON: BankTransferAccount = { beneficiary: "Halcyon Audio Ltd", iban: "GB69 MRDN 6016 1331 9268 19", bic: "MRDNGB2L", amount: 8400, reference: "HA-77310" };
const BREDA: BankTransferAccount = { beneficiary: "Stichting De Lindenhof", iban: "NL73 MRDN 0123 4567 89", bic: "MRDNNL2A", amount: 24950, reference: "LH-2026-0147" };

const DUTCH = {
  title: "Betalen via bankoverschrijving",
  lead: "Maak {amount} over naar onderstaande rekening. Je bestelling is bevestigd zodra de betaling binnen is.",
  beneficiary: "Begunstigde",
  iban: "IBAN",
  bic: "BIC",
  amount: "Bedrag",
  reference: "Betalingskenmerk",
  exact: "Moet exact kloppen",
  referenceNote: "Typ het precies zoals hier staat. Zo koppelen we je betaling aan deze bestelling.",
  copy: "Kopieer",
  copied: "Gekopieerd",
  deadline: "Betaal v\u00f3\u00f3r {date}. Daarna vervalt de bestelling.",
  lapsed: "De betaaltermijn eindigde op {date}. Deze bestelling is vervallen.",
};

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/** "2026-10-21T08:00:00Z": the shop is still waiting, three days before the deadline. */
const NOW = "2026-10-21T08:00:00Z";

/** What the status line calls each row, so it reads as a sentence: "Copied the BIC: MRDNNL2A". */
const NOUNS: Record<BankTransferField, string> = { beneficiary: "the beneficiary", iban: "the IBAN", bic: "the BIC", amount: "the amount", reference: "the reference" };

export default function Demo(): React.JSX.Element {
  const [copied, setCopied] = useState("Press a Copy button: the IBAN reaches the clipboard without its spaces.");
  const report = (field: BankTransferField, value: string): void => setCopied(`Copied ${NOUNS[field]}: ${value}`);

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="After the customer chooses bank transfer" note={copied}>
        <BankTransferDetails details={NORTHWIND} deadline="2026-10-24T21:59:00Z" now={NOW} timeZone="Europe/Amsterdam" locale="en-GB" onCopy={report} />
      </Example>

      <Example caption="In Dutch: the amount, the date and every word follow the locale">
        <BankTransferDetails details={BREDA} deadline="2026-10-30T21:59:00Z" now={NOW} timeZone="Europe/Amsterdam" locale="nl-NL" labels={DUTCH} />
      </Example>

      <Example caption="Past the deadline: the order has lapsed and the buttons are off">
        <BankTransferDetails details={HALCYON} currency="GBP" deadline="2026-10-18T16:00:00Z" now={NOW} timeZone="Europe/London" locale="en-GB" />
      </Example>

      <Example caption="No BIC and no deadline: the rows that are not needed are left out">
        <BankTransferDetails details={KESTREL} locale="en-GB" />
      </Example>
    </div>
  );
}
