"use client";

import { useId, useState } from "react";

import { IconAtSign, IconGitBranch, IconRss } from "@rhs-ui/icons";
import { FooterFoldingColumns, type FooterFoldingColumn } from "@rhs-ui/marketing/footer-folding-columns";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";

const COLUMNS: readonly FooterFoldingColumn[] = [
  {
    title: "Product",
    groups: [
      {
        heading: "Platform",
        links: [
          { label: "Compute", href: "#compute" },
          { label: "Storage", href: "#storage" },
          { label: "Databases", href: "#databases" },
          { label: "Networking", href: "#networking" },
        ],
      },
      {
        heading: "Solutions",
        links: [
          { label: "Startups", href: "#startups" },
          { label: "Agencies", href: "#agencies" },
          { label: "Enterprise", href: "#enterprise" },
        ],
      },
    ],
  },
  {
    title: "Developers",
    groups: [
      {
        links: [
          { label: "Documentation", href: "#docs" },
          { label: "API reference", href: "#api" },
          { label: "CLI", href: "#cli" },
          { label: "SDKs", href: "#sdks" },
          { label: "Changelog", href: "#changelog" },
          { label: "System status", href: "https://example.com/status", external: true },
        ],
      },
    ],
  },
  {
    title: "Company",
    groups: [
      {
        links: [
          { label: "About", href: "#about" },
          { label: "Customers", href: "#customers" },
          { label: "Careers", href: "#careers" },
          { label: "Press", href: "#press" },
          { label: "Contact", href: "#contact" },
        ],
      },
    ],
  },
  {
    title: "Resources",
    groups: [
      {
        links: [
          { label: "Blog", href: "#blog" },
          { label: "Guides", href: "#guides" },
          { label: "Events", href: "#events" },
          { label: "Community", href: "#community" },
          { label: "Webinars", href: "#webinars" },
        ],
      },
    ],
  },
  {
    title: "Compare",
    groups: [
      {
        links: [
          { label: "vs. self-hosting", href: "#self-hosting" },
          { label: "vs. a legacy VPS", href: "#vps" },
          { label: "Pricing", href: "#pricing" },
          { label: "Migration help", href: "#migration" },
        ],
      },
    ],
  },
  {
    title: "Legal",
    groups: [
      {
        links: [
          { label: "Privacy", href: "#privacy" },
          { label: "Terms", href: "#terms" },
          { label: "Security", href: "#security" },
          { label: "Data processing", href: "#dpa" },
          { label: "Subprocessors", href: "#subprocessors" },
        ],
      },
    ],
  },
];

function Newsletter(): React.JSX.Element {
  const id = useId();
  const [sent, setSent] = useState(false);
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <label htmlFor={id} className="text-sm font-medium">
        The infrastructure letter
      </label>
      <div className="flex gap-2">
        <Input id={id} type="email" autoComplete="email" required placeholder="you@company.com" />
        <Button type="submit" variant="outline">
          Subscribe
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" role="status">
        {sent ? "Thanks. The next one lands on the first Tuesday." : "One email a month. Outages, prices and what we learned."}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-3 px-6 py-6">
      <p className="text-xs text-muted-foreground">Six columns with sub-headings, all visible from 768px. On a phone each column folds into a row with a plus; Product starts open here.</p>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <FooterFoldingColumns
          brand={<span className="text-base font-semibold tracking-tight">Meridian Cloud</span>}
          tagline="Infrastructure for teams that ship every day and sleep at night."
          aside={<Newsletter />}
          columns={COLUMNS}
          defaultOpen={["Product"]}
          social={[
            { label: "GitHub", href: "https://example.com/github", icon: <IconGitBranch /> },
            { label: "Newsletter", href: "https://example.com/newsletter", icon: <IconAtSign /> },
            { label: "RSS feed", href: "https://example.com/rss", icon: <IconRss /> },
          ]}
          legal="© 2026 Meridian Cloud, Inc."
          legalLinks={[
            { label: "Privacy", href: "#privacy" },
            { label: "Terms", href: "#terms" },
            { label: "Cookies", href: "#cookies" },
          ]}
        />
      </div>
    </div>
  );
}
