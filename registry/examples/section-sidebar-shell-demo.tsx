"use client";

import { createContext, useContext, useState, type ComponentProps } from "react";

import { SectionSidebarShell, type ShellSection } from "@rhs-ui/application/section-sidebar-shell";
import {
  IconActivity,
  IconBell,
  IconCreditCard,
  IconDashboard,
  IconDatabase,
  IconDownload,
  IconFileText,
  IconGauge,
  IconGlobe,
  IconGrid,
  IconIdCard,
  IconKey,
  IconLock,
  IconMail,
  IconPlus,
  IconReceipt,
  IconRocket,
  IconScale,
  IconSettings,
  IconShield,
  IconTimer,
  IconUserPlus,
  IconUsers,
  IconWallet,
} from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Progress } from "@rhs-ui/primitives/progress";
import type { SidebarNavGroup } from "@rhs-ui/primitives/sidebar-nav";
import { StatusBadge } from "@rhs-ui/primitives/status-badge";

const SECTIONS: readonly ShellSection[] = [
  { id: "overview", label: "Overview", href: "/overview" },
  { id: "projects", label: "Projects", href: "/projects" },
  { id: "team", label: "Team", href: "/team" },
  { id: "billing", label: "Billing", href: "/billing" },
  { id: "settings", label: "Settings", href: "/settings" },
];

const SIDEBARS: Record<string, readonly SidebarNavGroup[]> = {
  overview: [
    {
      links: [
        { href: "/overview/dashboard", label: "Dashboard", icon: <IconDashboard /> },
        { href: "/overview/activity", label: "Activity", icon: <IconActivity /> },
        { href: "/overview/usage", label: "Usage", icon: <IconGauge /> },
        { href: "/overview/alerts", label: "Alerts", icon: <IconBell />, badge: "2" },
      ],
    },
  ],
  projects: [
    { links: [{ href: "/projects/all", label: "All projects", icon: <IconGrid /> }] },
    {
      label: "Build",
      links: [
        { href: "/projects/deployments", label: "Deployments", icon: <IconRocket /> },
        { href: "/projects/domains", label: "Domains", icon: <IconGlobe /> },
        { href: "/projects/environment", label: "Environment variables", icon: <IconKey /> },
      ],
    },
    {
      label: "Data",
      links: [
        { href: "/projects/storage", label: "Storage", icon: <IconDatabase /> },
        { href: "/projects/cron", label: "Cron jobs", icon: <IconTimer /> },
      ],
    },
    { label: "Protect", links: [{ href: "/projects/firewall", label: "Firewall", icon: <IconShield /> }] },
  ],
  team: [
    {
      links: [
        { href: "/team/members", label: "Members", icon: <IconUsers /> },
        { href: "/team/roles", label: "Roles", icon: <IconIdCard /> },
        { href: "/team/invitations", label: "Invitations", icon: <IconMail />, badge: "2" },
      ],
    },
  ],
  billing: [
    {
      links: [
        { href: "/billing/plan", label: "Plan", icon: <IconCreditCard /> },
        { href: "/billing/invoices", label: "Invoices", icon: <IconReceipt /> },
        { href: "/billing/payment", label: "Payment methods", icon: <IconWallet /> },
        { href: "/billing/limits", label: "Spend limits", icon: <IconScale /> },
      ],
    },
  ],
  settings: [
    {
      links: [
        { href: "/settings/general", label: "General", icon: <IconSettings /> },
        { href: "/settings/security", label: "Security", icon: <IconLock /> },
        { href: "/settings/tokens", label: "Access tokens", icon: <IconKey /> },
        { href: "/settings/audit", label: "Audit log", icon: <IconFileText /> },
      ],
    },
  ],
};

/** [title, detail, right-hand text, status, status label] */
type Row = readonly [string, string, string, string?, string?];
interface Page {
  blurb: string;
  rows?: readonly Row[];
  meters?: readonly (readonly [label: string, used: string, of: string, percent: number])[];
  stats?: readonly (readonly [label: string, value: string, note: string])[];
}

const PAGES: Record<string, Page> = {
  "/overview/dashboard": {
    blurb: "How production is doing across every project, over the last 24 hours.",
    stats: [
      ["Requests", "2.41M", "8.2% more than yesterday"],
      ["Error rate", "0.12%", "0.03 points lower"],
      ["p95 latency", "182 ms", "14 ms faster"],
    ],
    rows: [
      ["Deployed northwind-api to production", "Leo Martins · 3f9a2c1", "4 min ago", "approved", "Ready"],
      ["Domain api.northwind.example verified", "Dan Cho", "1 hour ago", "approved", "Verified"],
      ["Elevated 5xx rate on halcyon-web", "Resolved automatically after a rollback", "3 hours ago", "paused", "Resolved"],
      ["Spend limit raised to €500", "Mara Okafor", "Yesterday"],
    ],
  },
  "/overview/activity": {
    blurb: "Everything that changed in the team, newest first.",
    rows: [
      ["Leo Martins deployed northwind-api", "Production · fix redirect loop on /pricing", "4 min ago"],
      ["Dan Cho added a firewall rule", "Rate limit /api/auth to 20 per minute", "2 hours ago"],
      ["Mara Okafor invited jonas.keller@northwind.example", "As a developer", "Yesterday"],
      ["Priya Nair rotated STRIPE_SECRET_KEY", "Production and preview", "Yesterday"],
      ["Hana Sato changed the billing email", "billing@halcyon.studio", "Monday"],
    ],
  },
  "/overview/usage": {
    blurb: "What this billing period has used so far. It resets on 1 November.",
    meters: [
      ["Bandwidth", "412 GB", "of 1 TB", 41],
      ["Build minutes", "640", "of 1,000", 64],
      ["Function invocations", "3.1M", "of 10M", 31],
      ["Storage", "18 GB", "of 100 GB", 18],
    ],
  },
  "/overview/alerts": {
    blurb: "Open alerts need a person; resolved ones stay for 30 days.",
    rows: [
      ["Elevated 5xx rate on halcyon-web", "More than 1% of requests for 10 minutes", "Opened 3 hours ago", "failed", "Open"],
      ["Certificate for www.larkspur.example expires soon", "Renews automatically in 12 days", "Opened Monday", "pending", "Watching"],
      ["Build queue was slow", "Median wait was 4 minutes", "Resolved Friday", "archived", "Resolved"],
    ],
  },
  "/projects/all": {
    blurb: "Every project in the team, most recently deployed first.",
    rows: [
      ["northwind-api", "Production · api.northwind.example", "4 min ago", "approved", "Ready"],
      ["halcyon-web", "Production · www.halcyon.studio", "3 hours ago", "approved", "Ready"],
      ["kestrel-worker", "Preview · queue consumer", "Yesterday", "pending", "Building"],
      ["larkspur-site", "Production · www.larkspur.example", "Monday", "approved", "Ready"],
    ],
  },
  "/projects/deployments": {
    blurb: "Every build of northwind-api, with the commit that caused it.",
    rows: [
      ["Fix redirect loop on /pricing", "main · 3f9a2c1 · Leo Martins", "4 min ago", "approved", "Ready"],
      ["Add retry to the webhook sender", "main · b81d07e · Dan Cho", "Yesterday", "approved", "Ready"],
      ["Bump the image optimiser", "preview/images · 9ce44a0 · Sofia Rossi", "Yesterday", "failed", "Failed"],
      ["Update the cookie banner copy", "main · 0a7f9d3 · Ines Kowalski", "Monday", "approved", "Ready"],
    ],
  },
  "/projects/domains": {
    blurb: "The addresses that point at northwind-api.",
    rows: [
      ["api.northwind.example", "Production · primary", "Added 12 Sep", "approved", "Valid"],
      ["www.northwind.example", "Redirects to api.northwind.example", "Added 12 Sep", "approved", "Valid"],
      ["staging.northwind.example", "Preview · waiting for a DNS record", "Added today", "pending", "Pending"],
    ],
  },
  "/projects/environment": {
    blurb: "Secrets and settings the build and the running app can read.",
    rows: [
      ["DATABASE_URL", "Production, Preview", "Updated 3 days ago"],
      ["STRIPE_SECRET_KEY", "Production", "Updated yesterday"],
      ["SENTRY_DSN", "Production, Preview, Development", "Updated 2 weeks ago"],
      ["FEATURE_NEW_CHECKOUT", "Preview", "Updated 1 hour ago"],
    ],
  },
  "/projects/storage": {
    blurb: "Buckets for files your app stores.",
    rows: [
      ["uploads", "Customer files · private", "12.4 GB"],
      ["exports", "Generated reports · expire after 7 days", "3.1 GB"],
      ["avatars", "Profile photos · public", "640 MB"],
    ],
  },
  "/projects/cron": {
    blurb: "Scheduled calls to your own endpoints.",
    rows: [
      ["Nightly invoice export", "0 2 * * * · /api/cron/invoices", "Next run 02:00", "approved", "On"],
      ["Clear expired sessions", "*/15 * * * * · /api/cron/sessions", "Next run in 6 min", "approved", "On"],
      ["Weekly digest email", "0 8 * * 1 · /api/cron/digest", "Next run Monday", "paused", "Paused"],
    ],
  },
  "/projects/firewall": {
    blurb: "Rules that run before a request reaches your app.",
    rows: [
      ["Block traffic from known bad networks", "Managed rule · updated daily", "Applied to all paths", "approved", "Active"],
      ["Rate limit /api/auth to 20 per minute", "Custom rule · by IP address", "Applied to /api/auth", "approved", "Active"],
      ["Challenge requests without a user agent", "Custom rule", "Applied to all paths", "paused", "Paused"],
    ],
  },
  "/team/members": {
    blurb: "The people who can sign in to this team.",
    rows: [
      ["Mara Okafor", "mara@halcyon.studio", "Owner"],
      ["Leo Martins", "leo@halcyon.studio", "Admin"],
      ["Dan Cho", "dan@halcyon.studio", "Admin"],
      ["Priya Nair", "priya@halcyon.studio", "Developer"],
      ["Sofia Rossi", "sofia@halcyon.studio", "Developer"],
    ],
  },
  "/team/roles": {
    blurb: "What each role may do. Roles are the same for every project.",
    rows: [
      ["Owner", "Billing, members, every project", "1 person"],
      ["Admin", "Members and every project, no billing", "2 people"],
      ["Developer", "Deploy and change settings of their projects", "5 people"],
      ["Viewer", "Read-only access to deployments and logs", "1 person"],
    ],
  },
  "/team/invitations": {
    blurb: "People who have been asked to join and have not answered yet.",
    rows: [
      ["amara.diallo@halcyon.studio", "Invited by Mara Okafor as a developer", "Sent 24 Oct", "pending", "Pending"],
      ["jonas.keller@northwind.example", "Invited by Leo Martins as a viewer", "Sent 22 Oct", "pending", "Pending"],
    ],
  },
  "/billing/plan": {
    blurb: "You are on Pro. Your next invoice is on 1 November.",
    stats: [
      ["Plan", "Pro", "€20 per member each month"],
      ["Members", "8", "2 more than last month"],
      ["Next invoice", "€160.00", "Charged to Visa ending 4242"],
    ],
  },
  "/billing/invoices": {
    blurb: "Paid invoices stay available as PDFs for seven years.",
    rows: [
      ["INV-2048", "1 October", "€160.00", "paid", "Paid"],
      ["INV-2041", "1 September", "€140.00", "paid", "Paid"],
      ["INV-2033", "1 August", "€140.00", "paid", "Paid"],
      ["INV-2027", "1 July", "€120.00", "paid", "Paid"],
    ],
  },
  "/billing/payment": {
    blurb: "The card that is charged on the first of every month.",
    rows: [
      ["Visa ending 4242", "Expires 08/28 · Mara Okafor", "Default", "approved", "Default"],
      ["Mastercard ending 8210", "Expires 03/27 · Halcyon Studio B.V.", "Backup"],
    ],
  },
  "/billing/limits": {
    blurb: "Stop surprises: spending past a limit pauses new deployments.",
    rows: [
      ["Monthly spend limit", "Usage above the plan is billed up to this amount", "€500.00"],
      ["Email me at", "To billing@halcyon.studio", "80% of the limit"],
      ["Pause deployments at the limit", "Running apps are never paused", "Off"],
    ],
  },
  "/settings/general": {
    blurb: "The basics of this team.",
    rows: [
      ["Team name", "Shown in the header and on invoices", "Halcyon Studio"],
      ["Team URL", "Used in links to your dashboards", "kestrel.example/halcyon"],
      ["Default region", "Where new projects run", "Frankfurt"],
    ],
  },
  "/settings/security": {
    blurb: "How people prove who they are.",
    rows: [
      ["Require two-factor authentication", "Everyone must set it up within 7 days", "On", "approved", "On"],
      ["Single sign-on", "SAML with your identity provider", "Not set up"],
      ["Session length", "People are signed out after this long", "30 days"],
    ],
  },
  "/settings/tokens": {
    blurb: "Tokens let scripts and CI use Kestrel without a person.",
    rows: [
      ["CI deploy token", "Can deploy northwind-api · created by Leo Martins", "Used 4 min ago"],
      ["Log export token", "Read-only logs · created by Dan Cho", "Used yesterday"],
      ["Old migration token", "Full access · created by Leo Martins", "Never used"],
    ],
  },
  "/settings/audit": {
    blurb: "Who changed the team's settings, kept for 12 months.",
    rows: [
      ["Spend limit changed to €500", "Mara Okafor", "Yesterday"],
      ["Two-factor authentication required", "Mara Okafor", "3 days ago"],
      ["Role of Priya Nair changed to developer", "Leo Martins", "2 weeks ago"],
    ],
  },
};

const ACTIONS: Record<string, { label: string; icon: React.JSX.Element }> = {
  projects: { label: "New project", icon: <IconPlus /> },
  team: { label: "Invite members", icon: <IconUserPlus /> },
  billing: { label: "Download invoices", icon: <IconDownload /> },
};

// There is no router in a preview: the links report where they were pressed instead of navigating.
const Navigate = createContext<(href: string) => void>(() => undefined);

function AppLink({ href, ...props }: ComponentProps<"a">): React.JSX.Element {
  const go = useContext(Navigate);
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        go(href ?? "");
      }}
    />
  );
}

function Brand(): React.JSX.Element {
  return (
    <span className="flex items-center gap-2">
      <span className="grid size-6 place-items-center rounded-lg bg-foreground text-background">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="currentColor">
          <path d="M2 13 8 3l6 10h-3.2L8 8.4 5.2 13z" />
        </svg>
      </span>
      Kestrel
    </span>
  );
}

function Account(): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:ring-[3px] data-[state=open]:ring-ring/40"
        >
          <Avatar size="sm">
            <AvatarFallback>MO</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>mara@halcyon.studio</DropdownMenuLabel>
        <DropdownMenuItem>Account settings</DropdownMenuItem>
        <DropdownMenuItem>Switch team</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Usage(): React.JSX.Element {
  return (
    <div>
      <p className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">Build minutes</span>
        <span className="text-muted-foreground tabular-nums">640 of 1,000</span>
      </p>
      <Progress value={64} aria-label="Build minutes used" className="mt-2 h-1.5" />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [href, setHref] = useState("/projects/deployments");

  const section = SECTIONS.find((entry) => href === entry.href || href.startsWith(`${entry.href}/`)) ?? SECTIONS[0]!;
  const links = (SIDEBARS[section.id] ?? []).flatMap((group) => group.links);
  const link = links.find((entry) => entry.href === href);
  const page = PAGES[href];
  const action = ACTIONS[section.id];

  // A section link goes to the first page of its sidebar, as a router redirect would.
  const go = (target: string) => {
    const root = SECTIONS.find((entry) => entry.href === target);
    setHref(root ? (SIDEBARS[root.id]?.[0]?.links[0]?.href ?? target) : target);
  };

  return (
    // Below md the pages are a sheet fixed to the screen, so on a phone the frame is the screen: full-bleed, with no corner for the sheet to cover.
    <div className="h-[calc(100dvh-3rem)] min-h-[34rem] overflow-hidden rounded-xl border border-border max-md:h-dvh max-md:rounded-none max-md:border-0">
      <Navigate.Provider value={go}>
        <SectionSidebarShell
          className="h-full"
          mainId="section-main"
          brand={<Brand />}
          sections={SECTIONS}
          activeSection={section.id}
          sidebars={SIDEBARS}
          currentHref={href}
          linkAs={AppLink}
          account={<Account />}
          sidebarFooter={<Usage />}
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">{link?.label ?? section.label}</h2>
                <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{page?.blurb}</p>
              </div>
              {action ? (
                <Button variant={section.id === "projects" ? "default" : "outline"} size="sm">
                  {action.icon}
                  {action.label}
                </Button>
              ) : null}
            </div>

            {page?.stats ? (
              <dl className="mt-6 grid divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {page.stats.map(([label, value, note]) => (
                  <div key={label} className="px-5 py-4">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{value}</dd>
                    <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {page?.meters ? (
              <ul className="mt-6 grid gap-5 rounded-xl border border-border bg-card p-5">
                {page.meters.map(([label, used, of, percent]) => (
                  <li key={label}>
                    <p className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {used} {of}
                      </span>
                    </p>
                    <Progress value={percent} aria-label={`${label} used`} className="mt-2 h-1.5" />
                  </li>
                ))}
              </ul>
            ) : null}

            {page?.rows ? (
              <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {page.rows.map(([title, detail, right, status, statusLabel]) => (
                  <li key={title} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
                    </div>
                    {status ? <StatusBadge status={status} label={statusLabel} size="sm" className="shrink-0" /> : null}
                    <p className="hidden shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:block">{right}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </SectionSidebarShell>
      </Navigate.Provider>
    </div>
  );
}
