import { InsetSidebarShell } from "@rhs-ui/application/inset-sidebar-shell";
import {
  IconChartBar,
  IconCheckCircle,
  IconCheckSquare,
  IconChevronsUpDown,
  IconCircle,
  IconCircleDot,
  IconFolder,
  IconHome,
  IconInbox,
  IconPlus,
  IconSettings,
  IconShare,
  IconUsers,
} from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { SidebarNav } from "@rhs-ui/primitives/sidebar-nav";

type Status = "done" | "review" | "doing" | "todo";

const TASKS: { title: string; area: string; who: string; initials: string; due: string; status: Status }[] = [
  { title: "Final copy review for the pricing page", area: "Content", who: "Mara Okafor", initials: "MO", due: "30 Oct", status: "done" },
  { title: "Redirect map for 212 legacy URLs", area: "SEO", who: "Leo Martins", initials: "LM", due: "31 Oct", status: "done" },
  { title: "Keyboard pass of the checkout flow", area: "Accessibility", who: "Priya Nair", initials: "PN", due: "2 Nov", status: "review" },
  { title: "Replace placeholder photography", area: "Design", who: "Sofia Rossi", initials: "SR", due: "3 Nov", status: "doing" },
  { title: "Uptime checks and paging rules", area: "Infrastructure", who: "Dan Cho", initials: "DC", due: "4 Nov", status: "doing" },
  { title: "Cookie banner wording, Dutch and German", area: "Legal", who: "Ines Kowalski", initials: "IK", due: "4 Nov", status: "todo" },
  { title: "Load test the search endpoint at 400 rps", area: "Performance", who: "Dan Cho", initials: "DC", due: "5 Nov", status: "todo" },
  { title: "Email templates for order confirmations", area: "Content", who: "Mara Okafor", initials: "MO", due: "6 Nov", status: "todo" },
  { title: "Sitemap and canonical audit", area: "SEO", who: "Leo Martins", initials: "LM", due: "7 Nov", status: "todo" },
  { title: "Empty states for the account area", area: "Design", who: "Sofia Rossi", initials: "SR", due: "7 Nov", status: "todo" },
  { title: "Rollback rehearsal on staging", area: "Infrastructure", who: "Tomas Brandt", initials: "TB", due: "10 Nov", status: "todo" },
  { title: "Train support on the new returns flow", area: "Support", who: "Hana Sato", initials: "HS", due: "11 Nov", status: "todo" },
  { title: "Freeze content and tag the release", area: "Release", who: "Tomas Brandt", initials: "TB", due: "13 Nov", status: "todo" },
  { title: "Go-live call and handover", area: "Release", who: "Mara Okafor", initials: "MO", due: "14 Nov", status: "todo" },
];

const STATUS = {
  done: { label: "Done", icon: <IconCheckCircle className="size-[18px] text-foreground" /> },
  review: { label: "In review", icon: <IconCircleDot className="size-[18px] text-muted-foreground" /> },
  doing: { label: "In progress", icon: <IconCircleDot className="size-[18px] text-foreground" /> },
  todo: { label: "To do", icon: <IconCircle className="size-[18px] text-muted-foreground" /> },
} as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-6 place-items-center rounded-lg bg-foreground text-background">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="currentColor">
          <path d="M2 12.5a6 6 0 0 1 12 0z" />
        </svg>
      </span>
      Halcyon
    </div>
  );
}

function Account() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none transition-colors duration-150 hover:bg-background/70 focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-background/70"
        >
          <Avatar size="sm">
            <AvatarFallback>MO</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-tight font-medium">Mara Okafor</span>
            <span className="block truncate text-xs text-muted-foreground">mara@halcyon.studio</span>
          </span>
          <IconChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
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
  const done = TASKS.filter((task) => task.status === "done").length;
  return (
    <InsetSidebarShell
      mainId="inset-main"
      className="h-[calc(100dvh-3rem)] min-h-[32rem]"
      brand={<Brand />}
      nav={
        <SidebarNav
          label="Workspace"
          currentHref="/projects/northwind"
          groups={[
            {
              links: [
                { href: "/home", label: "Home", icon: <IconHome /> },
                { href: "/inbox", label: "Inbox", icon: <IconInbox />, badge: "4" },
                { href: "/tasks", label: "My tasks", icon: <IconCheckSquare /> },
              ],
            },
            {
              label: "Projects",
              links: [
                { href: "/projects/northwind", label: "Northwind redesign", icon: <IconFolder /> },
                { href: "/projects/kestrel", label: "Kestrel mobile app", icon: <IconFolder /> },
                { href: "/projects/larkspur", label: "Larkspur brand", icon: <IconFolder /> },
              ],
            },
            {
              label: "Workspace",
              links: [
                { href: "/people", label: "People", icon: <IconUsers /> },
                { href: "/reports", label: "Reports", icon: <IconChartBar /> },
                { href: "/settings", label: "Settings", icon: <IconSettings /> },
              ],
            },
          ]}
        />
      }
      footer={<Account />}
      header={{
        breadcrumbs: [{ label: "Projects", href: "/projects" }, { label: "Northwind redesign", href: "/projects/northwind" }, { label: "Launch checklist" }],
        actions: (
          <>
            <Button variant="outline" size="sm">
              <IconShare />
              <span className="max-lg:sr-only">Share</span>
            </Button>
            <Button size="sm">
              <IconPlus />
              New task
            </Button>
          </>
        ),
      }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Launch checklist</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Everything that has to be true before Northwind goes live on 14 November.</p>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">
            {done} of {TASKS.length} done
          </Badge>
          Next up: keyboard pass of the checkout flow, due 2 November.
        </p>
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {TASKS.map((task) => (
            <li key={task.title} className="flex items-center gap-3 px-4 py-3">
              {STATUS[task.status].icon}
              <span className="sr-only">{STATUS[task.status].label}: </span>
              <div className="min-w-0 flex-1">
                <p className={task.status === "done" ? "truncate text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/50" : "truncate text-sm font-medium"}>{task.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {task.area} · {task.who}
                </p>
              </div>
              <span className="hidden w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:block">{task.due}</span>
              <Avatar size="sm" className="shrink-0">
                <AvatarFallback>{task.initials}</AvatarFallback>
              </Avatar>
            </li>
          ))}
        </ul>
      </div>
    </InsetSidebarShell>
  );
}
