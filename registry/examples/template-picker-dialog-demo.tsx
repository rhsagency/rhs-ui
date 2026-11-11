"use client";

import { useRef, useState, type ReactNode } from "react";

import { TemplatePickerDialog, TemplatePickerPanel, type Template, type TemplateCategory } from "@rhs-ui/application/template-picker-dialog";
import { IconFilePlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [made, setMade] = useState("");
  const tries = useRef(0);

  async function create(id: string | null) {
    await wait(900);
    // The first Customer interview fails, so the way back can be seen: the dialog stays and says why.
    if (id === "customer-interview" && tries.current++ === 0) throw new Error("The workspace did not answer.");
    setMade(id ? `Created “${nameOf(id)}”.` : "Created a blank document.");
  }

  return (
    <div className="grid w-full gap-12">
      <Case caption="The dialog, from a button. Type to search by name or tag, use the arrow keys across the grid and press Enter to make it. Customer interview fails the first time, so you can see how a refusal reads.">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
          <TemplatePickerDialog
            trigger={
              <Button>
                <IconFilePlus />
                New document
              </Button>
            }
            templates={TEMPLATES}
            categories={CATEGORIES}
            onSelect={create}
          />
          <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
            {made || "Nothing made yet."}
          </p>
        </div>
      </Case>

      <Case caption="The inside of the dialog with Weekly report chosen. Blank is always the first card; the button names what you get, and the large preview and its description sit beside the grid. Below 640px that panel becomes a sheet at the foot.">
        <Surface>
          <TemplatePickerPanel standalone templates={TEMPLATES} categories={CATEGORIES} defaultSelected="weekly-report" onSelect={create} onClose={() => undefined} />
        </Surface>
      </Case>

      <Case caption="A search with no match: Blank stays, the empty state says what was searched and clears it in one press. The counts in the rail follow the search.">
        <Surface>
          <TemplatePickerPanel standalone templates={TEMPLATES} categories={CATEGORIES} defaultCategory="planning" defaultQuery="invoice" onSelect={create} onClose={() => undefined} />
        </Surface>
      </Case>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The dialog a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="relative flex h-[46rem] w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-md sm:h-[41rem]">{children}</div>;
}

const CATEGORIES: readonly TemplateCategory[] = [
  { id: "reports", label: "Reports" },
  { id: "planning", label: "Planning" },
  { id: "meetings", label: "Meetings" },
  { id: "product", label: "Product" },
];

const TEMPLATES: readonly Template[] = [
  {
    id: "weekly-report",
    name: "Weekly report",
    category: "reports",
    preview: <WeeklyReport />,
    tags: ["status", "update", "friday"],
    description: "A one-page status update: the headline numbers, a chart of the week and what comes next. Ready to send on Friday.",
  },
  {
    id: "monthly-metrics",
    name: "Monthly metrics",
    category: "reports",
    preview: <MonthlyMetrics />,
    tags: ["kpi", "dashboard", "numbers"],
    description: "Four numbers that matter, each with its trend line, and room for the story behind them.",
  },
  {
    id: "budget-tracker",
    name: "Budget tracker",
    category: "reports",
    preview: <BudgetTracker />,
    tags: ["finance", "spend", "forecast"],
    description: "Planned against actual spend by category, with a running total and a column for the difference.",
  },
  {
    id: "project-brief",
    name: "Project brief",
    category: "planning",
    preview: <ProjectBrief />,
    tags: ["kickoff", "scope", "goals"],
    description: "Goal, scope, audience and timeline on one page, so everyone starts from the same sentence.",
  },
  {
    id: "roadmap",
    name: "Roadmap",
    category: "planning",
    preview: <Roadmap />,
    tags: ["timeline", "gantt", "quarter"],
    description: "Quarter by quarter, with an owner on every line and the dependencies that could make it slip.",
  },
  {
    id: "launch-checklist",
    name: "Launch checklist",
    category: "planning",
    preview: <LaunchChecklist />,
    tags: ["release", "go-live", "tasks"],
    description: "Every task between sign-off and go-live, grouped by owner, with the due date beside it.",
  },
  {
    id: "meeting-notes",
    name: "Meeting notes",
    category: "meetings",
    preview: <MeetingNotes />,
    tags: ["agenda", "minutes", "actions"],
    description: "Agenda, notes and decisions in one place, with actions that carry an owner and a date.",
  },
  {
    id: "retrospective",
    name: "Retrospective",
    category: "meetings",
    preview: <Retrospective />,
    tags: ["sprint", "team", "review"],
    description: "What went well, what did not and what to try next, as three columns of notes the team can vote on.",
  },
  {
    id: "customer-interview",
    name: "Customer interview",
    category: "meetings",
    preview: <CustomerInterview />,
    tags: ["research", "discovery", "questions"],
    description: "A script with the questions in order, room for quotes and a summary of what you learned.",
  },
  {
    id: "product-spec",
    name: "Product spec",
    category: "product",
    preview: <ProductSpec />,
    tags: ["prd", "requirements", "feature"],
    description: "The problem, the proposal, the open questions and the acceptance criteria for one feature.",
  },
  {
    id: "kanban-board",
    name: "Kanban board",
    category: "product",
    preview: <KanbanBoard />,
    tags: ["tasks", "board", "agile"],
    description: "Backlog, doing and done for a small team, with a limit on how much can be in progress.",
  },
];

const nameOf = (id: string) => TEMPLATES.find((template) => template.id === id)?.name ?? id;

/* Previews are drawn, not photographed: every template is a page of ink on paper, in the page's own colours, so they scale from a card to the panel. */

/** A sheet of paper on the muted desk of the card. */
function Paper({ children, wide = false }: { children: ReactNode; wide?: boolean }): React.JSX.Element {
  return (
    <svg viewBox="0 0 160 120" role="presentation" aria-hidden="true" className="size-full">
      <rect width="160" height="120" className="fill-muted" />
      <rect x={wide ? 12 : 30} y="10" width={wide ? 136 : 100} height="104" rx="4" className="fill-background stroke-border" />
      {children}
    </svg>
  );
}

/** A line of text: strong for a heading, faint for body. */
function Ink({ x, y, w, strong = false }: { x: number; y: number; w: number; strong?: boolean }): React.JSX.Element {
  return <rect x={x} y={y} width={w} height={strong ? 4 : 3} rx="1.5" className={strong ? "fill-foreground/70" : "fill-foreground/20"} />;
}

/** A box: a stat, a card, a note. */
function Box({ x, y, w, h }: { x: number; y: number; w: number; h: number }): React.JSX.Element {
  return <rect x={x} y={y} width={w} height={h} rx="2" className="fill-muted stroke-border" />;
}

function WeeklyReport(): React.JSX.Element {
  const bars = [10, 18, 14, 24, 20];
  return (
    <Paper>
      <Ink x={38} y={20} w={46} strong />
      <Box x={38} y={32} w={26} h={18} />
      <Box x={67} y={32} w={26} h={18} />
      <Box x={96} y={32} w={26} h={18} />
      <Ink x={42} y={38} w={12} strong />
      <Ink x={71} y={38} w={12} strong />
      <Ink x={100} y={38} w={12} strong />
      {bars.map((height, i) => (
        <rect key={i} x={40 + i * 17} y={84 - height} width="11" height={height} rx="1.5" className="fill-foreground/35" />
      ))}
      <Ink x={38} y={92} w={84} />
      <Ink x={38} y={99} w={70} />
      <Ink x={38} y={106} w={50} />
    </Paper>
  );
}

function MonthlyMetrics(): React.JSX.Element {
  return (
    <Paper>
      <Ink x={38} y={20} w={52} strong />
      {[0, 1, 2, 3].map((i) => {
        const x = 38 + (i % 2) * 44;
        const y = 32 + Math.floor(i / 2) * 38;
        return (
          <g key={i}>
            <Box x={x} y={y} w={40} h={34} />
            <Ink x={x + 5} y={y + 6} w={14} strong />
            <polyline points={`${x + 5},${y + 28} ${x + 14},${y + 23} ${x + 22},${y + 26} ${x + 32},${y + 16}`} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-foreground/60" />
          </g>
        );
      })}
    </Paper>
  );
}

function BudgetTracker(): React.JSX.Element {
  return (
    <Paper>
      <Ink x={38} y={20} w={44} strong />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <g key={row}>
          <rect x={38} y={32 + row * 12} width="84" height={row === 0 ? 10 : 9} rx="1.5" className={row === 0 ? "fill-foreground/15" : "fill-muted"} />
          <Ink x={41} y={35 + row * 12} w={row === 0 ? 14 : 18} strong={row === 0} />
          <Ink x={72} y={35 + row * 12} w={10} strong={row === 0} />
          <Ink x={100} y={35 + row * 12} w={14} strong={row === 0} />
        </g>
      ))}
    </Paper>
  );
}

function ProjectBrief(): React.JSX.Element {
  return (
    <Paper>
      <Ink x={38} y={20} w={52} strong />
      <Box x={38} y={30} w={84} h={28} />
      <path d="M38 52l20-12 14 8 12-10 38 14v4a2 2 0 0 1-2 2H40a2 2 0 0 1-2-2z" className="fill-foreground/10" />
      <Ink x={38} y={66} w={38} strong />
      <Ink x={38} y={74} w={38} />
      <Ink x={38} y={80} w={32} />
      <Ink x={38} y={86} w={36} />
      <Ink x={84} y={66} w={38} strong />
      <Ink x={84} y={74} w={36} />
      <Ink x={84} y={80} w={38} />
      <Ink x={84} y={86} w={28} />
      <Ink x={38} y={98} w={84} />
    </Paper>
  );
}

function Roadmap(): React.JSX.Element {
  const bars = [
    { x: 38, w: 26 },
    { x: 52, w: 38 },
    { x: 70, w: 30 },
    { x: 90, w: 28 },
    { x: 58, w: 40 },
  ];
  return (
    <Paper>
      <Ink x={38} y={20} w={40} strong />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={38 + i * 21} x2={38 + i * 21} y1={30} y2={104} strokeWidth="1" className="stroke-border" />
      ))}
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y={36 + i * 13} width={bar.w} height="8" rx="2" className={i % 2 === 0 ? "fill-foreground/70" : "fill-foreground/30"} />
      ))}
    </Paper>
  );
}

function LaunchChecklist(): React.JSX.Element {
  const widths = [52, 40, 60, 46, 54, 36];
  return (
    <Paper>
      <Ink x={38} y={20} w={50} strong />
      {widths.map((width, i) => (
        <g key={i}>
          <rect x={38} y={33 + i * 12} width="7" height="7" rx="1.5" className={i < 3 ? "fill-foreground/80" : "fill-background stroke-muted-foreground/50"} />
          <Ink x={50} y={35 + i * 12} w={width} />
          <Ink x={106} y={35 + i * 12} w={16} strong={i < 3} />
        </g>
      ))}
    </Paper>
  );
}

function MeetingNotes(): React.JSX.Element {
  const widths = [70, 56, 64, 44, 60];
  return (
    <Paper>
      <Ink x={38} y={20} w={54} strong />
      <Ink x={38} y={29} w={26} />
      {widths.map((width, i) => (
        <g key={i}>
          <circle cx="41" cy={43 + i * 11} r="1.8" className="fill-foreground/50" />
          <Ink x={48} y={41.5 + i * 11} w={width} />
        </g>
      ))}
      <Ink x={38} y={98} w={30} strong />
      <Ink x={72} y={98} w={46} />
    </Paper>
  );
}

function Retrospective(): React.JSX.Element {
  return (
    <Paper wide>
      {[0, 1, 2].map((col) => (
        <g key={col}>
          <Ink x={22 + col * 44} y={22} w={32} strong />
          {[0, 1, 2].slice(0, col === 1 ? 2 : 3).map((n) => (
            <g key={n}>
              <Box x={22 + col * 44} y={34 + n * 24} w={38} h={20} />
              <Ink x={26 + col * 44} y={40 + n * 24} w={30} />
            </g>
          ))}
        </g>
      ))}
    </Paper>
  );
}

function CustomerInterview(): React.JSX.Element {
  const asked = [60, 48, 66];
  const first = [70, 62, 54];
  const second = [48, 66, 40];
  return (
    <Paper>
      <Ink x={38} y={20} w={56} strong />
      {asked.map((width, i) => (
        <g key={i}>
          <Ink x={38} y={34 + i * 24} w={width} strong />
          <rect x="38" y={42 + i * 24} width="2" height="12" rx="1" className="fill-foreground/25" />
          <Ink x={44} y={43 + i * 24} w={first[i] ?? 60} />
          <Ink x={44} y={50 + i * 24} w={second[i] ?? 50} />
        </g>
      ))}
    </Paper>
  );
}

function ProductSpec(): React.JSX.Element {
  return (
    <Paper>
      <Ink x={38} y={20} w={48} strong />
      <Ink x={38} y={30} w={84} />
      <Ink x={38} y={36} w={74} />
      <Ink x={38} y={46} w={30} strong />
      <rect x="38" y="54" width="84" height="26" rx="2" className="fill-muted stroke-border" />
      <line x1="38" x2="122" y1="63" y2="63" className="stroke-border" />
      <line x1="38" x2="122" y1="72" y2="72" className="stroke-border" />
      <line x1="80" x2="80" y1="54" y2="80" className="stroke-border" />
      <Ink x={42} y={58} w={20} strong />
      <Ink x={42} y={67} w={26} />
      <Ink x={84} y={67} w={30} />
      <Ink x={38} y={88} w={36} strong />
      <Ink x={38} y={96} w={80} />
      <Ink x={38} y={102} w={60} />
    </Paper>
  );
}

function KanbanBoard(): React.JSX.Element {
  const cards = [4, 3, 2];
  return (
    <Paper wide>
      {cards.map((count, col) => (
        <g key={col}>
          <rect x={20 + col * 42} y="20" width="38" height="84" rx="3" className="fill-muted" />
          <Ink x={24 + col * 42} y={26} w={20} strong />
          {Array.from({ length: count }, (_, n) => (
            <g key={n}>
              <rect x={24 + col * 42} y={36 + n * 16} width="30" height="13" rx="2" className="fill-background stroke-border" />
              <Ink x={27 + col * 42} y={40 + n * 16} w={18} />
              <Ink x={27 + col * 42} y={45 + n * 16} w={10} />
            </g>
          ))}
        </g>
      ))}
    </Paper>
  );
}
