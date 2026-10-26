"use client";

import { createContext, useContext, useState, type ComponentProps } from "react";

import { RailPanelShell, type RailArea } from "@rhs-ui/application/rail-panel-shell";
import {
  IconActivity,
  IconArchive,
  IconAtSign,
  IconBookmark,
  IconBriefcase,
  IconCalendar,
  IconCalendarCheck,
  IconChartBar,
  IconClock,
  IconFlag,
  IconFolder,
  IconGrid,
  IconInbox,
  IconMail,
  IconPlus,
  IconScale,
  IconShield,
  IconSitemap,
  IconTimer,
  IconTrendDown,
  IconTrendUp,
  IconUserCheck,
  IconUsers,
} from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { SidebarNav, type SidebarNavGroup } from "@rhs-ui/primitives/sidebar-nav";

const AREAS: readonly RailArea[] = [
  { id: "inbox", label: "Inbox", icon: <IconInbox />, badge: 4, badgeLabel: "unread" },
  { id: "projects", label: "Projects", icon: <IconFolder /> },
  { id: "calendar", label: "Calendar", icon: <IconCalendar /> },
  { id: "people", label: "People", icon: <IconUsers /> },
  { id: "reports", label: "Reports", icon: <IconChartBar /> },
];

const PAGES: Record<string, readonly SidebarNavGroup[]> = {
  inbox: [
    {
      links: [
        { href: "/inbox/unread", label: "Unread", icon: <IconMail />, badge: "4" },
        { href: "/inbox/mentions", label: "Mentions", icon: <IconAtSign /> },
        { href: "/inbox/assigned", label: "Assigned to me", icon: <IconUserCheck /> },
      ],
    },
    {
      label: "Filed",
      links: [
        { href: "/inbox/snoozed", label: "Snoozed", icon: <IconClock /> },
        { href: "/inbox/saved", label: "Saved", icon: <IconBookmark /> },
        { href: "/inbox/archive", label: "Archive", icon: <IconArchive /> },
      ],
    },
  ],
  projects: [
    { links: [{ href: "/projects/all", label: "All projects", icon: <IconGrid /> }] },
    {
      label: "Active",
      links: [
        { href: "/projects/northwind", label: "Northwind redesign", icon: <IconFolder /> },
        { href: "/projects/kestrel", label: "Kestrel mobile app", icon: <IconFolder /> },
        { href: "/projects/larkspur", label: "Larkspur brand", icon: <IconFolder /> },
      ],
    },
    { label: "Done", links: [{ href: "/projects/archived", label: "Archived", icon: <IconArchive /> }] },
  ],
  calendar: [
    {
      links: [
        { href: "/calendar/week", label: "This week", icon: <IconCalendar /> },
        { href: "/calendar/month", label: "Month", icon: <IconCalendarCheck /> },
      ],
    },
    {
      label: "Planning",
      links: [
        { href: "/calendar/milestones", label: "Milestones", icon: <IconFlag /> },
        { href: "/calendar/availability", label: "Team availability", icon: <IconUsers /> },
      ],
    },
  ],
  people: [
    {
      links: [
        { href: "/people/everyone", label: "Everyone", icon: <IconUsers /> },
        { href: "/people/admins", label: "Admins", icon: <IconShield /> },
        { href: "/people/contractors", label: "Contractors", icon: <IconBriefcase /> },
      ],
    },
    {
      label: "Manage",
      links: [
        { href: "/people/invitations", label: "Invitations", icon: <IconMail />, badge: "2" },
        { href: "/people/teams", label: "Teams", icon: <IconSitemap /> },
      ],
    },
  ],
  reports: [
    {
      links: [
        { href: "/reports/overview", label: "Overview", icon: <IconActivity /> },
        { href: "/reports/velocity", label: "Velocity", icon: <IconTrendUp /> },
      ],
    },
    {
      label: "Detail",
      links: [
        { href: "/reports/time", label: "Time tracking", icon: <IconTimer /> },
        { href: "/reports/workload", label: "Workload", icon: <IconScale /> },
      ],
    },
  ],
};

const BLURB: Record<string, string> = {
  unread: "Everything that is waiting for you, newest first.",
  mentions: "The places a teammate called your name.",
  assigned: "Tasks that landed on your plate this week.",
  snoozed: "Hidden until you said they should come back.",
  saved: "Messages you pinned so you can find them again.",
  archive: "Done and dusted. Search works here too.",
  all: "Every project in the workspace, active ones first.",
  northwind: "The redesign that goes live on 14 November.",
  kestrel: "The mobile app for iOS and Android, now in beta.",
  larkspur: "A brand refresh: logo, colour and tone of voice.",
  archived: "Finished projects, kept for reference.",
  week: "The next seven days for the whole team.",
  month: "Releases and reviews across October and November.",
  milestones: "The dates the projects are measured against.",
  availability: "Who is away, and when they are back.",
  everyone: "Everyone with access to Halcyon.",
  admins: "People who can change billing and permissions.",
  contractors: "External collaborators with limited access.",
  invitations: "Invites that have not been accepted yet.",
  teams: "Design, engineering, content and support.",
  overview: "How the workspace is doing this month.",
  velocity: "Tasks closed per week over the last quarter.",
  time: "Hours logged against each project.",
  workload: "Who is carrying how much right now.",
};

const NOUN: Record<string, readonly [string, string]> = {
  inbox: ["message", "messages"],
  projects: ["task", "tasks"],
  calendar: ["event", "events"],
  people: ["entry", "entries"],
  reports: ["figure", "figures"],
};

type Lead = { kind: "person"; text: string } | { kind: "date"; day: string; month: string } | { kind: "trend"; up: boolean };
interface Row {
  title: string;
  meta: string;
  trailing: string;
  lead: Lead;
  /** The pages this row appears on, by the last part of their address. */
  on: string;
}

const person = (text: string): Lead => ({ kind: "person", text });
const day = (d: string, month: string): Lead => ({ kind: "date", day: d, month });
const trend = (up: boolean): Lead => ({ kind: "trend", up });

const ROWS: Record<string, readonly Row[]> = {
  inbox: [
    { title: "Priya Nair mentioned you", meta: "Keyboard pass of the checkout flow", trailing: "12 min ago", lead: person("PN"), on: "unread mentions" },
    { title: "Leo Martins assigned you a task", meta: "Redirect map for 212 legacy URLs", trailing: "1 hour ago", lead: person("LM"), on: "unread assigned" },
    { title: "Sofia Rossi commented", meta: "Replace placeholder photography", trailing: "3 hours ago", lead: person("SR"), on: "unread" },
    { title: "Dan Cho asked for a review", meta: "Uptime checks and paging rules", trailing: "Yesterday", lead: person("DC"), on: "unread assigned" },
    { title: "Ines Kowalski mentioned you", meta: "Cookie banner wording, Dutch and German", trailing: "Monday", lead: person("IK"), on: "mentions saved" },
    { title: "Sofia Rossi mentioned you", meta: "Logo lockups for dark backgrounds", trailing: "Last week", lead: person("SR"), on: "mentions" },
    { title: "Mara Okafor assigned you a task", meta: "Email templates for order confirmations", trailing: "Last week", lead: person("MO"), on: "assigned" },
    { title: "Hana Sato shared a file", meta: "Returns flow training deck", trailing: "Back tomorrow", lead: person("HS"), on: "snoozed saved" },
    { title: "Leo Martins commented", meta: "Sitemap and canonical audit", trailing: "Back Monday", lead: person("LM"), on: "snoozed" },
    { title: "Dan Cho commented", meta: "Load test the search endpoint at 400 rps", trailing: "Back 10 Nov", lead: person("DC"), on: "snoozed" },
    { title: "Tomas Brandt finished a task", meta: "Rollback rehearsal on staging", trailing: "Monday", lead: person("TB"), on: "archive" },
    { title: "Priya Nair finished a task", meta: "Accessibility notes for the checkout", trailing: "2 weeks ago", lead: person("PN"), on: "archive saved" },
    { title: "Mara Okafor finished a task", meta: "Final copy review for the pricing page", trailing: "2 weeks ago", lead: person("MO"), on: "archive" },
  ],
  projects: [
    { title: "Final copy review for the pricing page", meta: "Mara Okafor", trailing: "30 Oct", lead: person("MO"), on: "all northwind" },
    { title: "Redirect map for 212 legacy URLs", meta: "Leo Martins", trailing: "31 Oct", lead: person("LM"), on: "all northwind" },
    { title: "Replace placeholder photography", meta: "Sofia Rossi", trailing: "3 Nov", lead: person("SR"), on: "all northwind" },
    { title: "Cookie banner wording, Dutch and German", meta: "Ines Kowalski", trailing: "4 Nov", lead: person("IK"), on: "all northwind" },
    { title: "Go-live call and handover", meta: "Mara Okafor", trailing: "14 Nov", lead: person("MO"), on: "all northwind" },
    { title: "Push notification permissions flow", meta: "Dan Cho", trailing: "4 Nov", lead: person("DC"), on: "all kestrel" },
    { title: "Offline mode for saved trips", meta: "Leo Martins", trailing: "10 Nov", lead: person("LM"), on: "all kestrel" },
    { title: "App Store screenshots in six locales", meta: "Sofia Rossi", trailing: "12 Nov", lead: person("SR"), on: "all kestrel" },
    { title: "Logo lockups for dark backgrounds", meta: "Sofia Rossi", trailing: "6 Nov", lead: person("SR"), on: "all larkspur" },
    { title: "Tone of voice guide, second draft", meta: "Mara Okafor", trailing: "7 Nov", lead: person("MO"), on: "all larkspur" },
    { title: "Brand colour contrast audit", meta: "Priya Nair", trailing: "9 Nov", lead: person("PN"), on: "all larkspur" },
    { title: "Moodboard for the spring campaign", meta: "Sofia Rossi", trailing: "Done 12 Sep", lead: person("SR"), on: "archived" },
    { title: "Intranet migration to the new CMS", meta: "Leo Martins", trailing: "Done 30 Sep", lead: person("LM"), on: "archived" },
    { title: "Supplier onboarding guide", meta: "Hana Sato", trailing: "Done 3 Oct", lead: person("HS"), on: "archived" },
  ],
  calendar: [
    { title: "Design review", meta: "Tuesday · 10:30 to 11:15 · Room 2", trailing: "5 people", lead: day("28", "Oct"), on: "week month" },
    { title: "Sprint planning", meta: "Wednesday · 09:30 to 10:30 · Video call", trailing: "9 people", lead: day("29", "Oct"), on: "week month" },
    { title: "Northwind content freeze", meta: "Thursday · All day", trailing: "Milestone", lead: day("30", "Oct"), on: "week month milestones" },
    { title: "Accessibility walkthrough", meta: "Friday · 14:00 to 15:00 · Room 1", trailing: "4 people", lead: day("31", "Oct"), on: "week month" },
    { title: "Kestrel beta release", meta: "Monday · 14:00", trailing: "Release", lead: day("3", "Nov"), on: "month milestones" },
    { title: "Support training: returns flow", meta: "Tuesday · 13:00 to 14:30 · Room 1", trailing: "8 people", lead: day("4", "Nov"), on: "month" },
    { title: "Northwind go-live", meta: "Friday · 10:00", trailing: "Milestone", lead: day("14", "Nov"), on: "month milestones" },
    { title: "Larkspur brand handover", meta: "Friday · 16:00", trailing: "Milestone", lead: day("21", "Nov"), on: "month milestones" },
    { title: "Dan Cho is away", meta: "Wednesday 29 Oct · Dentist", trailing: "Half a day", lead: person("DC"), on: "availability" },
    { title: "Priya Nair is away", meta: "Monday 3 to Friday 7 Nov · Annual leave", trailing: "5 days", lead: person("PN"), on: "availability" },
    { title: "Hana Sato is away", meta: "Monday 10 to Tuesday 11 Nov · Conference", trailing: "2 days", lead: person("HS"), on: "availability" },
  ],
  people: [
    { title: "Mara Okafor", meta: "Head of design · mara@halcyon.studio", trailing: "Owner", lead: person("MO"), on: "everyone admins" },
    { title: "Leo Martins", meta: "Engineering lead · leo@halcyon.studio", trailing: "Admin", lead: person("LM"), on: "everyone admins" },
    { title: "Dan Cho", meta: "Infrastructure · dan@halcyon.studio", trailing: "Admin", lead: person("DC"), on: "everyone admins" },
    { title: "Priya Nair", meta: "Accessibility specialist · priya@halcyon.studio", trailing: "Member", lead: person("PN"), on: "everyone" },
    { title: "Sofia Rossi", meta: "Visual designer · sofia@halcyon.studio", trailing: "Member", lead: person("SR"), on: "everyone" },
    { title: "Hana Sato", meta: "Support lead · hana@halcyon.studio", trailing: "Member", lead: person("HS"), on: "everyone" },
    { title: "Ines Kowalski", meta: "Legal counsel · ines@kowalski.law", trailing: "Contractor", lead: person("IK"), on: "everyone contractors" },
    { title: "Marcus Webb", meta: "Copywriter · marcus@webbwrites.example", trailing: "Contractor", lead: person("MW"), on: "everyone contractors" },
    { title: "amara.diallo@halcyon.studio", meta: "Invited 24 Oct as a member", trailing: "Pending", lead: person("AD"), on: "invitations" },
    { title: "jonas.keller@northwind.example", meta: "Invited 22 Oct as a contractor", trailing: "Pending", lead: person("JK"), on: "invitations" },
    { title: "Design", meta: "4 people · led by Mara Okafor", trailing: "Team", lead: person("DS"), on: "teams" },
    { title: "Engineering", meta: "6 people · led by Leo Martins", trailing: "Team", lead: person("EN"), on: "teams" },
    { title: "Content", meta: "3 people · led by Marcus Webb", trailing: "Team", lead: person("CT"), on: "teams" },
    { title: "Support", meta: "5 people · led by Hana Sato", trailing: "Team", lead: person("SP"), on: "teams" },
  ],
  reports: [
    { title: "Cycle time", meta: "Median, last 30 days", trailing: "3.4 days", lead: trend(false), on: "overview" },
    { title: "Tasks closed", meta: "Last 7 days", trailing: "86", lead: trend(true), on: "overview" },
    { title: "Review turnaround", meta: "Median, last 30 days", trailing: "5.2 hours", lead: trend(false), on: "overview" },
    { title: "Bugs reopened", meta: "Share of closed bugs", trailing: "4.1%", lead: trend(false), on: "overview" },
    { title: "On-time delivery", meta: "Tasks finished by their due date", trailing: "92%", lead: trend(true), on: "overview" },
    { title: "Week 43", meta: "20 to 26 Oct", trailing: "86 closed", lead: trend(true), on: "velocity" },
    { title: "Week 42", meta: "13 to 19 Oct", trailing: "79 closed", lead: trend(false), on: "velocity" },
    { title: "Week 41", meta: "6 to 12 Oct", trailing: "91 closed", lead: trend(true), on: "velocity" },
    { title: "Week 40", meta: "29 Sep to 5 Oct", trailing: "74 closed", lead: trend(false), on: "velocity" },
    { title: "Northwind redesign", meta: "Design, content and engineering", trailing: "168 h", lead: trend(true), on: "time" },
    { title: "Kestrel mobile app", meta: "Engineering and QA", trailing: "142 h", lead: trend(true), on: "time" },
    { title: "Larkspur brand", meta: "Design", trailing: "64 h", lead: trend(false), on: "time" },
    { title: "Leo Martins", meta: "11 open tasks", trailing: "112% of capacity", lead: trend(true), on: "workload" },
    { title: "Sofia Rossi", meta: "8 open tasks", trailing: "86% of capacity", lead: trend(true), on: "workload" },
    { title: "Priya Nair", meta: "4 open tasks, away 3 to 7 Nov", trailing: "48% of capacity", lead: trend(false), on: "workload" },
  ],
};

function LeadTile({ lead }: { lead: Lead }): React.JSX.Element {
  if (lead.kind === "person") {
    return (
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback>{lead.text}</AvatarFallback>
      </Avatar>
    );
  }
  if (lead.kind === "date") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-center leading-none">
        <span>
          <span className="block text-sm font-semibold tabular-nums">{lead.day}</span>
          <span className="mt-0.5 block text-[0.625rem] tracking-wide text-muted-foreground uppercase">{lead.month}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
      {lead.up ? <IconTrendUp className="size-4" /> : <IconTrendDown className="size-4" />}
      <span className="sr-only">{lead.up ? "Trending up" : "Trending down"}</span>
    </span>
  );
}

// There is no router in a preview: the links report where they were pressed instead of navigating.
const Navigate = createContext<(href: string) => void>(() => undefined);

function PageLink({ href, ...props }: ComponentProps<"a">): React.JSX.Element {
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
    <span className="grid size-9 place-items-center rounded-xl bg-muted text-foreground">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M2.5 12.5a5.5 5.5 0 0 1 11 0" />
        <path d="M5.5 12.5a2.5 2.5 0 0 1 5 0" />
        <path d="M8 3v2.5" />
      </svg>
      <span className="sr-only">Halcyon</span>
    </span>
  );
}

function Account(): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="grid size-10 place-items-center rounded-lg outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-muted"
        >
          <Avatar size="sm">
            <AvatarFallback>MO</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" sideOffset={10} className="w-56">
        <DropdownMenuLabel>Signed in as mara@halcyon.studio</DropdownMenuLabel>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Notification settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Demo(): React.JSX.Element {
  const [area, setArea] = useState("projects");
  const [href, setHref] = useState("/projects/northwind");

  const areaLabel = AREAS.find((entry) => entry.id === area)?.label ?? "";
  const groups = PAGES[area] ?? [];
  const page = groups.flatMap((group) => group.links).find((link) => link.href === href);
  const key = href.split("/").pop() ?? "";
  const rows = (ROWS[area] ?? []).filter((row) => row.on.split(" ").includes(key));

  const changeArea = (next: string) => {
    if (next === area) return;
    setArea(next);
    setHref(PAGES[next]?.[0]?.links[0]?.href ?? "");
  };

  return (
    // Below md the pages are a sheet fixed to the screen, so on a phone the frame is the screen: full-bleed, with no corner for the sheet to cover.
    <div className="h-[calc(100dvh-3rem)] min-h-[34rem] overflow-hidden rounded-xl border border-border max-md:h-dvh max-md:rounded-none max-md:border-0">
      <Navigate.Provider value={setHref}>
        <RailPanelShell
          className="h-full"
          mainId="rail-main"
          brand={<Brand />}
          areas={AREAS}
          activeArea={area}
          onAreaChange={changeArea}
          railFooter={<Account />}
          panelActions={
            <Button variant="ghost" size="icon-sm" aria-label="New page">
              <IconPlus />
            </Button>
          }
          panel={<SidebarNav key={area} label={`${areaLabel} pages`} groups={groups} currentHref={href} linkAs={PageLink} />}
        >
          <div className="mx-auto w-full max-w-3xl">
            <p className="text-xs font-medium text-muted-foreground">{areaLabel}</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <h2 className="min-w-0 text-2xl font-semibold tracking-[-0.03em] text-balance">{page?.label}</h2>
              <Badge variant="secondary" className="shrink-0">
                {rows.length} {NOUN[area]?.[rows.length === 1 ? 0 : 1]}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{BLURB[key]}</p>
            <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {rows.map((row) => (
                <li key={row.title} className="flex items-center gap-3 px-4 py-3">
                  <LeadTile lead={row.lead} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{row.title}</p>
                    {/* On a phone the date joins the meta line, which gives way first, so the title keeps the full width. */}
                    <p className="mt-0.5 flex gap-1.5 text-xs text-muted-foreground">
                      <span className="min-w-0 truncate">{row.meta}</span>
                      <span className="shrink-0 tabular-nums sm:hidden">· {row.trailing}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground tabular-nums max-sm:hidden">{row.trailing}</p>
                </li>
              ))}
            </ul>
          </div>
        </RailPanelShell>
      </Navigate.Provider>
    </div>
  );
}
