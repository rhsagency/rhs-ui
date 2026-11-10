"use client";

import { useState, type ReactNode } from "react";

import { FilterableNav, type FilterableNavGroup } from "@rhs-ui/primitives/filterable-nav";

const API = "/docs/api";

const GROUPS: readonly FilterableNavGroup[] = [
  {
    label: "Getting started",
    items: [
      { label: "Introduction", href: `${API}/introduction` },
      { label: "Authentication", href: `${API}/authentication`, keywords: ["api keys", "bearer token"] },
      { label: "Errors", href: `${API}/errors`, keywords: ["status codes"] },
      { label: "Rate limits", href: `${API}/rate-limits`, keywords: ["throttling", "429"] },
      { label: "Pagination", href: `${API}/pagination`, keywords: ["cursor", "paging"] },
      { label: "Idempotency", href: `${API}/idempotency`, keywords: ["retries", "duplicate requests"] },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "List customers", href: `${API}/customers/list`, badge: "GET" },
      { label: "Create a customer", href: `${API}/customers/create`, badge: "POST" },
      { label: "Retrieve a customer", href: `${API}/customers/retrieve`, badge: "GET" },
      { label: "Update a customer", href: `${API}/customers/update`, badge: "PATCH" },
      { label: "Delete a customer", href: `${API}/customers/delete`, badge: "DELETE" },
      { label: "Merge customers", href: `${API}/customers/merge`, badge: "POST", keywords: ["duplicates"] },
    ],
  },
  {
    label: "Invoices",
    items: [
      { label: "List invoices", href: `${API}/invoices/list`, badge: "GET" },
      { label: "Create an invoice", href: `${API}/invoices/create`, badge: "POST" },
      { label: "Retrieve an invoice", href: `${API}/invoices/retrieve`, badge: "GET" },
      { label: "Finalize an invoice", href: `${API}/invoices/finalize`, badge: "POST" },
      { label: "Send an invoice", href: `${API}/invoices/send`, badge: "POST", keywords: ["email", "reminder"] },
      { label: "Void an invoice", href: `${API}/invoices/void`, badge: "POST" },
      { label: "Download as PDF", href: `${API}/invoices/pdf`, badge: "GET" },
    ],
  },
  {
    label: "Subscriptions",
    items: [
      { label: "List subscriptions", href: `${API}/subscriptions/list`, badge: "GET" },
      { label: "Create a subscription", href: `${API}/subscriptions/create`, badge: "POST" },
      { label: "Update a subscription", href: `${API}/subscriptions/update`, badge: "PATCH" },
      { label: "Cancel a subscription", href: `${API}/subscriptions/cancel`, badge: "DELETE", keywords: ["churn", "downgrade"] },
      { label: "Pause collection", href: `${API}/subscriptions/pause`, badge: "POST" },
      { label: "Preview a proration", href: `${API}/subscriptions/proration`, badge: "GET", keywords: ["upcoming invoice"] },
    ],
  },
  {
    label: "Webhooks",
    items: [
      { label: "List endpoints", href: `${API}/webhooks/list`, badge: "GET" },
      { label: "Create an endpoint", href: `${API}/webhooks/create`, badge: "POST" },
      { label: "Update an endpoint", href: `${API}/webhooks/update`, badge: "PATCH" },
      { label: "Delete an endpoint", href: `${API}/webhooks/delete`, badge: "DELETE" },
      { label: "Roll the signing secret", href: `${API}/webhooks/roll`, badge: "POST", keywords: ["verify signatures", "hmac"] },
      { label: "Retry a delivery", href: `${API}/webhooks/retry`, badge: "POST", keywords: ["redeliver", "replay"] },
    ],
  },
  {
    label: "Events",
    items: [
      { label: "List events", href: `${API}/events/list`, badge: "GET" },
      { label: "Retrieve an event", href: `${API}/events/retrieve`, badge: "GET" },
      { label: "Event types", href: `${API}/events/types`, keywords: ["webhook payloads"] },
    ],
  },
];

const LABELS = { total: "{count} pages" };

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground sm:min-h-12">{caption}</p>
      {children}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="h-[28rem] rounded-xl border border-border bg-card p-3 text-card-foreground shadow-xs">{children}</div>;
}

function Reference(): React.JSX.Element {
  const [current, setCurrent] = useState(`${API}/invoices/finalize`);
  return (
    <Panel>
      <FilterableNav groups={GROUPS} currentHref={current} onNavigate={setCurrent} placeholder="Filter the reference…" aria-label="API reference" labels={LABELS} className="h-full" />
    </Panel>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl gap-x-8 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
      <Example caption="Fold away what you do not need. The page you are on is open and marked. Type to filter all 34 pages at once, or press the down arrow to walk the list.">
        <Reference />
      </Example>

      <Example caption="Filtering for “invoice”: matches are marked, groups with nothing to show are gone, and a link found by a keyword shows it.">
        <Panel>
          <FilterableNav groups={GROUPS} defaultQuery="invoice" currentHref={`${API}/invoices/finalize`} onNavigate={() => {}} aria-label="API reference, filtered" labels={LABELS} className="h-full" />
        </Panel>
      </Example>

      <Example caption="No match offers a way back instead of a blank panel.">
        <Panel>
          <FilterableNav groups={GROUPS} defaultQuery="zzz" onNavigate={() => {}} aria-label="API reference, no match" labels={LABELS} className="h-full" />
        </Panel>
      </Example>
    </div>
  );
}
