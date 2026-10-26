import type { ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { CopyableText } from "@rhs-ui/primitives/copyable-text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const DEPLOYS = [
  { id: "dpl_8Hq2xN9vK3mTz7WcY1aBe4RfLp2Qx9Zt", commit: "9f3c2a7e41b8d05c6a91f2e7b3d4c8a05e61f7d2", state: "Ready" },
  { id: "dpl_2Lm5vQ8tXc0RzK6nBw3Ys9UeHk4Mj7Vd", commit: "c41e07b9a2f65d38e1b0c7a94d2f8e63b5a10c97", state: "Building" },
  { id: "dpl_7Tn4cR1yZk9WqH2xMe5Vb8JdSg6Fa3Ny", commit: "5d8a1f3c07e92b46a8d1c3f5e7b9024a6c8e1d3f", state: "Ready" },
  { id: "dpl_6Gp0wS3uVd7XhA4jNr2Ck1LtBq8Ze5Pm", commit: "e20b7c94d1a35f68b0e2c4a6d8f1735b9c0e2a4d", state: "Canceled" },
] as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="In a key-value list: each id sits where it belongs, one click from the clipboard">
        <dl className="max-w-xl divide-y divide-border rounded-xl border border-border bg-card px-4 text-sm shadow-xs">
          {(
            [
              ["Order", <CopyableText key="order" value="ORD-2026-104822" label="order id" mono />],
              ["Customer", "Marit de Vries"],
              ["Email", <CopyableText key="email" value="marit.devries@northwind.example" label="email" />],
              ["Tracking", <CopyableText key="track" value="3SKEST0049218847" label="tracking number" mono />],
              ["Payment", <CopyableText key="pay" value="pi_3QxK2Lm8vRt0Zc41aBcDeFgH" label="payment reference" mono truncate="middle" />],
            ] as const
          ).map(([term, value]) => (
            <div key={term} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-4 py-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="min-w-0 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Example>

      <Example caption="The states, shown without pressing: resting, copied, and the fallback when the browser blocks the clipboard">
        {/* The tooltip opens above, so the caption sits below and the card leaves room at the top. */}
        <div className="grid max-w-xl gap-x-6 gap-y-14 rounded-xl border border-border bg-card px-5 pt-14 pb-5 text-sm shadow-xs sm:grid-cols-3 sm:gap-y-0">
          <div className="grid content-start justify-items-start gap-2.5">
            <CopyableText value="ORD-2026-104822" label="order id" mono />
            <p className="text-xs text-muted-foreground">Resting</p>
          </div>
          <div className="grid content-start justify-items-start gap-2.5">
            <CopyableText value="ORD-2026-104822" label="order id" mono status="copied" />
            <p className="text-xs text-muted-foreground">Copied</p>
          </div>
          <div className="grid content-start justify-items-start gap-2.5">
            <CopyableText value="ORD-2026-104822" label="order id" mono status="manual" />
            <p className="text-xs text-muted-foreground">Blocked clipboard</p>
          </div>
        </div>
      </Example>

      <Example caption="In a table cell: a long id gives up its middle and keeps its end, a commit shows seven characters and copies all forty">
        <div className="max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%] sm:w-[35%]">Deployment</TableHead>
                <TableHead className="w-[32%] sm:w-[33%]">Commit</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEPLOYS.map((deploy) => (
                <TableRow key={deploy.id}>
                  <TableCell>
                    <CopyableText value={deploy.id} label="deployment id" mono truncate="middle" tail={7} />
                  </TableCell>
                  <TableCell>
                    <CopyableText value={deploy.commit} display={deploy.commit.slice(0, 7)} label="commit hash" mono truncate />
                  </TableCell>
                  <TableCell>
                    <Badge variant={deploy.state === "Ready" ? "success" : deploy.state === "Canceled" ? "muted" : "outline"}>{deploy.state}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>

      <Example caption="In a narrow box: wrap anywhere, cut at the end, or cut the middle and keep the ending">
        <div className="grid w-60 max-w-full gap-4 rounded-xl border border-border bg-card p-4 text-sm shadow-xs">
          <CopyableText value="sk_live_demo_0000_not_a_real_key_4d2e" label="secret key" mono />
          <CopyableText value="https://northwind.example/invoices/INV-20418?token=7Hq2xN9v" label="invoice link" truncate />
          <CopyableText value="https://northwind.example/invoices/INV-20418?token=7Hq2xN9v" label="invoice link" truncate="middle" tail={11} />
        </div>
      </Example>

      <Example caption="Inline, it takes the size of the text around it">
        <p className="text-[0.9375rem] leading-7">
          Quote reference <CopyableText value="NW-48217" label="reference" mono /> in every message, and we can find your order in seconds. Prefer email? Write to{" "}
          <CopyableText value="support@northwind.example" label="support address" />.
        </p>
      </Example>
    </div>
  );
}
