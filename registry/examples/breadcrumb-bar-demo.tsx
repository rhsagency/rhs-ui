"use client";

import { useState } from "react";

import { IconEdit, IconPrinter, IconShare } from "@rhs-ui/icons";
import { BreadcrumbBar } from "@rhs-ui/marketing/breadcrumb-bar";
import { Navbar } from "@rhs-ui/marketing/navbar";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          From 768px the full trail, with the page's actions; when the page changed joins them from 1024px. Below 768px it is one Back link to the parent, which is what a phone needs.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <Navbar
            sticky={false}
            brand={
              <a href="#top" className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                Halcyon Help
              </a>
            }
            items={[
              { label: "Guides", href: "#guides" },
              { label: "Billing", href: "#billing" },
              { label: "Contact", href: "#contact" },
            ]}
            currentHref="#guides"
            actions={<Button size="sm">Open the app</Button>}
          />
          <BreadcrumbBar
            trail={[
              { label: "Help centre", href: "#help" },
              { label: "Guides", href: "#guides" },
              { label: "Billing", href: "#billing" },
              { label: "Download an invoice" },
            ]}
            updated={{ label: "Updated 3 March 2026", dateTime: "2026-03-03" }}
            actions={
              <>
                <Button variant="ghost" size="sm" onClick={() => setNote("The share sheet would open here, with the link to this page.")}>
                  <IconShare />
                  <span className="sr-only sm:not-sr-only">Share</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setNote("The print dialog would open here.")}>
                  <IconPrinter />
                  <span className="sr-only sm:not-sr-only">Print</span>
                </Button>
              </>
            }
          />
          <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid max-w-2xl gap-4">
              <h2 className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl">Download an invoice</h2>
              <p className="text-base leading-relaxed text-pretty text-muted-foreground">Open Billing, choose the month and press the download icon next to the invoice. Invoices are PDFs, numbered in order, and kept for seven years.</p>
              <p className="min-h-5 text-xs text-muted-foreground" role="status">
                {note}
              </p>
            </div>
          </article>
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          From 768px a long trail keeps the first crumb and the last two and folds the levels between them into the dots menu; on a phone the Back link names the nearest parent.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <BreadcrumbBar
            labels={{ trail: "Breadcrumb, long trail" }}
            trail={[
              { label: "Help centre", href: "#help" },
              { label: "Guides", href: "#guides" },
              { label: "Billing", href: "#billing" },
              { label: "Invoices", href: "#invoices" },
              { label: "Tax and VAT", href: "#tax" },
              { label: "Reverse-charge invoices" },
            ]}
            actions={
              <Button variant="outline" size="sm" asChild>
                <a href="#edit">
                  <IconEdit />
                  <span className="sr-only sm:not-sr-only">Edit this page</span>
                </a>
              </Button>
            }
          />
          <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">Six levels deep, and the bar is still one line.</p>
        </div>
      </figure>
    </div>
  );
}
