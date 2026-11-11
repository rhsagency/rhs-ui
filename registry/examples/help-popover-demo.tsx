import { Fragment, type ReactNode } from "react";

import { HelpPopover } from "@rhs-ui/primitives/help-popover";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** An endpoint that may break after each slash, so a table too narrow for it wraps it at a natural place and keeps its other columns. */
function Endpoint({ text }: { text: string }): React.JSX.Element {
  return (
    <>
      {text.split("/").map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <>
              /<wbr />
            </>
          ) : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}

/** A label with its help button beside it, the way every field of a form can have one. */
function LabelRow({ htmlFor, children, help }: { htmlFor: string; children: ReactNode; help: ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor}>{children}</Label>
      {help}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="@container grid w-full max-w-2xl gap-10">
      <Example caption="Beside a label: to the right of the field when there is room, otherwise above the label, or below the field when there is no room above">
        <section className="grid max-w-md gap-5 rounded-xl border border-border bg-card p-5 shadow-xs @lg:p-6">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold tracking-[-0.02em]">API access</h2>
            <p className="text-sm text-muted-foreground">Limits for the key used by the Northwind storefront.</p>
          </div>
          <div className="grid gap-5">
            <div className="grid max-w-xs gap-2">
              <LabelRow
                htmlFor="help-rate"
                help={
                  <HelpPopover
                    label="Help: Rate limit"
                    title="Rate limit"
                    links={[
                      { label: "Read the rate limit guide", href: "/docs/rate-limits" },
                      { label: "Check the status page", href: "https://status.halcyon.example", external: true },
                    ]}
                  >
                    <p>
                      The most requests one key can make in a minute. Over it, the API answers <code>429</code> with a <code>Retry-After</code> header.
                    </p>
                    <pre>
                      <code>{"GET /v1/orders HTTP/1.1\nAuthorization: Bearer $KEY"}</code>
                    </pre>
                  </HelpPopover>
                }
              >
                Rate limit
              </LabelRow>
              <Input id="help-rate" defaultValue="600" inputMode="numeric" className="tabular-nums" />
              <p className="text-xs text-muted-foreground">Requests per minute</p>
            </div>
            <div className="grid max-w-xs gap-2">
              <LabelRow
                htmlFor="help-burst"
                help={
                  <HelpPopover label="Help: Burst limit" title="Burst limit">
                    <p>How many requests may arrive in the same second before the per-minute limit starts to count. Bursts refill at the per-second rate.</p>
                  </HelpPopover>
                }
              >
                Burst limit
              </LabelRow>
              <Input id="help-burst" defaultValue="40" inputMode="numeric" className="tabular-nums" />
              <p className="text-xs text-muted-foreground">Requests per second</p>
            </div>
          </div>
          <div className="grid max-w-xs gap-2">
            <LabelRow
              htmlFor="help-secret"
              help={
                <HelpPopover label="Help: Webhook secret" title="Webhook secret" links={[{ label: "Verify a signature", href: "/docs/webhooks#verify" }]}>
                  <p>Halcyon signs every delivery with this secret, so your server can tell a real event from a forged one.</p>
                  <ul>
                    <li>Keep it on your server, never in the browser.</li>
                    <li>Rotate it every 90 days.</li>
                    <li>The old secret works for 24 hours after a rotation.</li>
                  </ul>
                </HelpPopover>
              }
            >
              Webhook secret
            </LabelRow>
            <Input id="help-secret" type="password" defaultValue="whsec_8f2a91c4d7e0" autoComplete="off" />
          </div>
        </section>
      </Example>

      <Example caption="Small, in a table header, with no heading: the button still has a name of its own">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {/* A phone leaves 254px at the narrowest: smaller type and tighter cells keep all three columns in it. The last column keeps room on the right for the help button's touch target. */}
          <Table className="max-sm:text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="max-sm:px-1.5">Endpoint</TableHead>
                <TableHead className="text-right max-sm:px-1.5">
                  <span className="inline-flex items-center justify-end gap-0.5">
                    Latency
                    <HelpPopover size="sm" label="Help: Latency" align="end" side="bottom">
                      <p>The 95th percentile: 19 in 20 requests were this fast or faster. It is measured at the edge, in milliseconds.</p>
                    </HelpPopover>
                  </span>
                </TableHead>
                <TableHead className="text-right max-sm:pr-3 max-sm:pl-1.5">
                  <span className="inline-flex items-center justify-end gap-0.5">
                    Errors
                    <HelpPopover size="sm" label="Help: Errors" align="end" side="bottom">
                      <p>
                        The share of requests that ended in a <code>5xx</code> response. A <code>4xx</code> is the caller&apos;s mistake and is not counted.
                      </p>
                    </HelpPopover>
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { path: "GET /v1/orders", latency: "84 ms", errors: "0.02%" },
                { path: "POST /v1/orders", latency: "212 ms", errors: "0.11%" },
                { path: "GET /v1/customers", latency: "61 ms", errors: "0.00%" },
              ].map((row) => (
                <TableRow key={row.path}>
                  <TableCell className="font-mono text-xs max-sm:px-1.5 max-sm:text-[0.6875rem]">
                    <Endpoint text={row.path} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums max-sm:px-1.5">{row.latency}</TableCell>
                  <TableCell className="text-right tabular-nums max-sm:pr-3 max-sm:pl-1.5">{row.errors}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>
    </div>
  );
}
