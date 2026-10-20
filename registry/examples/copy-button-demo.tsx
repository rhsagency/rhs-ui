"use client";

import type { ReactNode } from "react";

import { CopyButton, type CopyStatus } from "@rhs-ui/primitives/copy-button";

const INVOICE = "Invoice INV-2041, Northwind Studio\nIssued 14 Oct 2026, due 28 Oct 2026\nTotal: EUR 4,860.00";

const STATES: { status: CopyStatus; caption: string }[] = [
  { status: "idle", caption: "Idle" },
  { status: "copied", caption: "Copied, for a moment" },
  { status: "manual", caption: "Clipboard blocked: the text is selected" },
];

function Example({ caption, children, wide = false }: { caption: string; children: ReactNode; wide?: boolean }): React.JSX.Element {
  return (
    <div className={wide ? "col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3"}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="A share link: the icon draws into a check, the label says so">
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card p-1.5 pl-3.5 shadow-xs">
          <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] text-muted-foreground">northwind.app/s/k7xq2m</span>
          <CopyButton value="https://northwind.app/s/k7xq2m" label="Copy link" copiedLabel="Link copied" size="sm" variant="default" />
        </div>
      </Example>

      <Example caption="Icon only: the label moves to a tooltip">
        <div className="flex w-full items-center gap-1 rounded-lg border border-border bg-muted/50 py-1 pr-1.5 pl-3.5">
          <code className="min-w-0 flex-1 truncate font-mono text-[0.8125rem]">
            <span className="text-muted-foreground select-none">$ </span>npm install @northwind/ui
          </code>
          <CopyButton iconOnly variant="ghost" size="sm" value="npm install @northwind/ui" label="Copy command" />
        </div>
      </Example>

      <Example caption="Variants">
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value="NW-4F7A-92KD" />
          <CopyButton value="NW-4F7A-92KD" variant="secondary" />
          <CopyButton value="NW-4F7A-92KD" variant="ghost" />
        </div>
      </Example>

      <Example caption="Text worked out when pressed, even from a slow source">
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={() => `${INVOICE}\nExported ${new Date().toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" })}`} label="Copy summary" copiedLabel="Summary copied" />
          <CopyButton
            value={async () => {
              await new Promise((resolve) => setTimeout(resolve, 400));
              return INVOICE;
            }}
            label="Copy as text"
            copiedLabel="Text copied"
            variant="secondary"
          />
        </div>
      </Example>

      <Example wide caption="Every state, shown from outside with status">
        <div className="flex flex-wrap gap-x-8 gap-y-5">
          {STATES.map(({ status, caption }) => (
            <div key={status} className="grid min-w-0 justify-items-start gap-2">
              <CopyButton status={status} value="https://northwind.app/s/k7xq2m" label="Copy link" copiedLabel="Link copied" />
              <span className="text-xs text-muted-foreground">{caption}</span>
            </div>
          ))}
        </div>
      </Example>
    </div>
  );
}
