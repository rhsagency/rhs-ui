import { IconEdit } from "@rhs-ui/icons";
import { DocsPageLayout } from "@rhs-ui/marketing/docs-page-layout";
import { Button } from "@rhs-ui/primitives/button";
import { Callout } from "@rhs-ui/primitives/callout";
import { CodeBlock } from "@rhs-ui/primitives/code-block";
import { PagerNav } from "@rhs-ui/primitives/pager-nav";
import { SidebarNav } from "@rhs-ui/primitives/sidebar-nav";

const VERIFY = `const crypto = require("node:crypto");

function verify(rawBody, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${parts.t}.\${rawBody}\`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
}`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-[88rem] px-6">
      <DocsPageLayout
        className="[--sticky-top:0px]"
        titleAs="h2"
        sidebar={
          <SidebarNav
            label="Documentation"
            currentHref="/docs/webhooks"
            groups={[
              {
                label: "Getting started",
                links: [
                  { href: "/docs/introduction", label: "Introduction" },
                  { href: "/docs/quickstart", label: "Quickstart" },
                  { href: "/docs/authentication", label: "Authentication" },
                ],
              },
              {
                label: "Core concepts",
                links: [
                  { href: "/docs/events", label: "Events" },
                  { href: "/docs/webhooks", label: "Webhooks" },
                  { href: "/docs/idempotency", label: "Idempotency" },
                  { href: "/docs/pagination", label: "Pagination" },
                ],
              },
              {
                label: "Guides",
                links: [
                  { href: "/docs/testing", label: "Testing locally" },
                  { href: "/docs/going-live", label: "Going live", badge: "New" },
                ],
              },
              {
                label: "API reference",
                links: [
                  { href: "/docs/api/orders", label: "Orders" },
                  { href: "/docs/api/customers", label: "Customers" },
                  { href: "/docs/api/shipments", label: "Shipments" },
                  { href: "/docs/api/depots", label: "Depots" },
                ],
              },
            ]}
          />
        }
        breadcrumbs={[{ label: "Docs", href: "/docs/introduction" }, { label: "Core concepts", href: "/docs/events" }, { label: "Webhooks" }]}
        title="Webhooks"
        description="Kestrel calls your server when something happens to an order. Verify the signature, answer within five seconds and we take care of the retries."
        updated={{ label: "Updated 12 October 2026", dateTime: "2026-10-12" }}
        readingTime="6 min read"
        toc={[
          { id: "how-it-works", title: "How it works", level: 2 },
          { id: "verify-the-signature", title: "Verify the signature", level: 2 },
          { id: "use-the-raw-body", title: "Use the raw body", level: 3 },
          { id: "replay-protection", title: "Replay protection", level: 3 },
          { id: "retries-and-ordering", title: "Retries and ordering", level: 2 },
          { id: "test-it-locally", title: "Test it locally", level: 2 },
        ]}
        footer={
          <div className="grid gap-8">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <a href="#edit" className="inline-flex items-center gap-2 font-medium text-foreground underline-offset-4 hover:underline">
                <IconEdit size={16} />
                Edit this page on GitHub
              </a>
              <p className="flex items-center gap-2">
                Was this page helpful?
                <Button variant="outline" size="sm">
                  Yes
                </Button>
                <Button variant="outline" size="sm">
                  No
                </Button>
              </p>
            </div>
            <PagerNav noun="page" previous={{ href: "/docs/events", title: "Events" }} next={{ href: "/docs/idempotency", title: "Idempotency" }} />
          </div>
        }
      >
        <p>
          Every time an order changes state, Kestrel sends a <code>POST</code> request to the endpoint you registered. The body is a JSON <a href="#events">event</a>, and the request is signed, so you can be sure it
          came from us and not from someone who found your URL.
        </p>
        <h2 id="how-it-works">How it works</h2>
        <p>Webhooks are the fastest way to follow a parcel without polling. Setting one up takes three steps:</p>
        <ol>
          <li>
            Register an HTTPS endpoint under <strong>Developers, Webhooks</strong> and choose the events you want.
          </li>
          <li>
            Copy the signing secret that appears once, and store it next to your other secrets.
          </li>
          <li>Answer every request with a <code>2xx</code> status within five seconds. Do the slow work afterwards.</li>
        </ol>
        <h2 id="verify-the-signature">Verify the signature</h2>
        <p>
          Each request carries three headers. The one that matters is <code>Kestrel-Signature</code>: a timestamp and an HMAC-SHA256 of the timestamp and the body, signed with your secret.
        </p>
        <table>
          <thead>
            <tr>
              <th>Header</th>
              <th>What it carries</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>Kestrel-Signature</code>
              </td>
              <td>
                The timestamp and signature, as <code>t=…,v1=…</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>Kestrel-Event</code>
              </td>
              <td>
                The event type, for example <code>order.paid</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>Kestrel-Delivery</code>
              </td>
              <td>A unique id for this attempt. Log it, support will ask for it.</td>
            </tr>
          </tbody>
        </table>
        <CodeBlock filename="verify.js" code={VERIFY} />
        <h3 id="use-the-raw-body">Use the raw body</h3>
        <p>Compute the signature over the bytes you received, before any JSON parser touches them. Re-serialising the body changes whitespace and key order, and the signature will never match.</p>
        <Callout tone="warning" title="Parse after you verify">
          Frameworks that parse JSON for you usually keep the raw body on the request object. Find that property once, and verify from it.
        </Callout>
        <h3 id="replay-protection">Replay protection</h3>
        <p>
          Reject any request whose timestamp is more than five minutes old. A stolen request is then useless to whoever replays it, and you do not have to store anything to know.
        </p>
        <h2 id="retries-and-ordering">Retries and ordering</h2>
        <p>
          If your endpoint answers with anything but a <code>2xx</code>, or does not answer in time, we retry with growing gaps: one minute, ten minutes, one hour, then every six hours for two days. Events are not
          guaranteed to arrive in order, so compare the <code>updated_at</code> field before you overwrite anything.
        </p>
        <ul>
          <li>Make your handler idempotent: the same delivery can arrive twice.</li>
          <li>Store the delivery id, and skip ones you have seen.</li>
          <li>Return <code>410</code> to stop retries for an endpoint you have removed.</li>
        </ul>
        <h2 id="test-it-locally">Test it locally</h2>
        <p>
          The CLI forwards live events to a port on your machine and prints the signing secret for that session, so you can develop without a public URL.
        </p>
        <pre tabIndex={0}>
          <code>{"kestrel listen --forward-to localhost:3000/webhooks"}</code>
        </pre>
      </DocsPageLayout>
    </div>
  );
}
