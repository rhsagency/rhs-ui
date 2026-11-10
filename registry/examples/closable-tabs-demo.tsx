"use client";

import { useRef, useState, type ReactNode } from "react";

import { IconChartBar, IconChartLine, IconFileCode, IconFileSheet, IconFileText, IconTable, IconUsers } from "@rhs-ui/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@rhs-ui/primitives/alert-dialog";
import { ClosableTabs, type ClosableTab } from "@rhs-ui/primitives/closable-tabs";
import { TabsContent } from "@rhs-ui/primitives/tabs";

interface Report extends ClosableTab {
  note: string;
  figures: readonly (readonly [string, string])[];
}

const START: readonly Report[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <IconChartBar />,
    closable: false,
    note: "A pinned tab has no close button, and Delete does nothing on it.",
    figures: [["Revenue", "€4.82M"], ["Net retention", "112%"], ["Open deals", "38"]],
  },
  {
    id: "q3",
    label: "Report Q3",
    icon: <IconFileSheet />,
    note: "Net revenue is tracking 7% above plan, led by Benelux and the Nordics.",
    figures: [["Net revenue", "€4.82M"], ["Gross margin", "63.4%"], ["New logos", "27"]],
  },
  {
    id: "churn",
    label: "Churn by cohort",
    icon: <IconChartLine />,
    dirty: true,
    note: "This one has unsaved changes, so closing it asks first. The dot becomes a cross on hover.",
    figures: [["Logo churn", "1.9%"], ["Revenue churn", "0.8%"], ["Cohorts", "14"]],
  },
  {
    id: "pipeline",
    label: "Pipeline review",
    icon: <IconTable />,
    note: "Forty-one opportunities, nine of them past their expected close date.",
    figures: [["Pipeline", "€2.10M"], ["Weighted", "€0.86M"], ["Stalled", "9"]],
  },
  {
    id: "headcount",
    label: "Headcount plan",
    icon: <IconUsers />,
    note: "Hiring for support and solutions engineering is ahead of plan.",
    figures: [["Today", "212"], ["Open roles", "14"], ["Attrition", "6.1%"]],
  },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Workspace(): React.JSX.Element {
  const [reports, setReports] = useState<readonly Report[]>(START);
  const [value, setValue] = useState("q3");
  const [asking, setAsking] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  /** Where focus was when the question opened, so a refusal can put it back. A dialog with no trigger has nowhere of its own to return it. */
  const asker = useRef<HTMLElement | null>(null);

  const remove = (id: string) => setReports((all) => all.filter((report) => report.id !== id));
  const asked = reports.find((report) => report.id === asking);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <ClosableTabs
        label="Open reports"
        tabs={reports}
        value={value}
        onValueChange={setValue}
        maxTabs={7}
        addLabel="New report"
        // Closing is your decision: a report with unsaved changes asks first.
        onClose={(id) => {
          if (!reports.find((report) => report.id === id)?.dirty) return remove(id);
          asker.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          setAsking(id);
        }}
        onAdd={() => {
          const id = `draft-${count}`;
          setCount((n) => n + 1);
          setReports((all) => [...all, { id, label: `Untitled report ${count}`, icon: <IconFileText />, dirty: true, note: "A new report starts with unsaved changes.", figures: [["Revenue", "€0"], ["Margin", "n/a"], ["Rows", "0"]] }]);
          setValue(id);
        }}
      >
        {reports.map((report) => (
          <TabsContent key={report.id} value={report.id} className="grid min-h-40 content-start gap-4">
            <p className="max-w-prose text-sm text-muted-foreground">{report.note}</p>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
              {report.figures.map(([term, figure]) => (
                <div key={term} className="flex items-baseline justify-between gap-3 bg-card px-4 py-2.5 sm:grid sm:justify-items-start sm:gap-0.5">
                  <dt className="truncate text-xs text-muted-foreground">{term}</dt>
                  <dd className="text-base font-semibold tracking-[-0.03em] tabular-nums">{figure}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
        ))}
      </ClosableTabs>
      {reports.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Every report is closed. Use the plus to open a new one.</p> : null}
      <AlertDialog open={asking !== null} onOpenChange={(open) => !open && setAsking(null)}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            // Keep open: back to the tab that asked. Discard: that tab is gone and the strip puts focus on its neighbour.
            event.preventDefault();
            asker.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes to {asked?.label}?</AlertDialogTitle>
            <AlertDialogDescription>The report has unsaved changes. If you close it now they are lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep open</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => asking && remove(asking)}>
              Discard and close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const FILES: readonly ClosableTab[] = [
  { id: "index", label: "index.ts", icon: <IconFileCode /> },
  { id: "routes", label: "routes.ts", icon: <IconFileCode />, dirty: true },
  { id: "schema", label: "schema.sql", icon: <IconFileCode /> },
  { id: "readme", label: "README.md", icon: <IconFileText /> },
  { id: "billing", label: "billing.ts", icon: <IconFileCode /> },
  { id: "webhooks", label: "webhooks.ts", icon: <IconFileCode /> },
  { id: "retry", label: "retry.ts", icon: <IconFileCode /> },
  { id: "money", label: "money.ts", icon: <IconFileCode />, dirty: true },
];

function Editor(): React.JSX.Element {
  const [files, setFiles] = useState<readonly ClosableTab[]>(FILES);
  const [value, setValue] = useState("routes");
  return (
    <div className="grid gap-3">
      <ClosableTabs label="Open files" tabs={files} value={value} onValueChange={setValue} onClose={(id) => setFiles((all) => all.filter((file) => file.id !== id))} />
      <p className="text-xs text-muted-foreground tabular-nums">
        {files.length} open{files.find((file) => file.id === value) ? `, selected ${files.find((file) => file.id === value)?.label}` : ""}
      </p>
    </div>
  );
}

/** The mailboxes the plus opens, in turn. */
const MORE = ["Archive", "Starred", "Spam", "Trash", "Snoozed"] as const;

function Limited(): React.JSX.Element {
  const [tabs, setTabs] = useState<readonly ClosableTab[]>([
    { id: "a", label: "Inbox" },
    { id: "b", label: "Drafts" },
    { id: "c", label: "Sent" },
  ]);
  const [value, setValue] = useState("a");
  /** How many were opened, not how many are open: an id is never used twice, however many were closed in between. */
  const opened = useRef(0);
  return (
    <div className="grid gap-3">
      <ClosableTabs
        label="Mailboxes"
        tabs={tabs}
        value={value}
        onValueChange={setValue}
        maxTabs={3}
        onClose={(id) => setTabs((all) => all.filter((tab) => tab.id !== id))}
        onAdd={() => {
          const n = opened.current++;
          const id = `m${n}`;
          setTabs((all) => [...all, { id, label: MORE[n] ?? `Mailbox ${n + 1}` }]);
          setValue(id);
        }}
      />
      <p className="text-xs text-muted-foreground">At three the plus is dimmed and says why. Close one and it works again.</p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-12">
      <Example caption="Close with the button, a middle click or Delete. The nearest tab takes over and gets focus; the dirty one asks first.">
        <Workspace />
      </Example>
      <div className="grid gap-12 md:grid-cols-2 md:gap-x-10">
        <Example caption="More tabs than room scroll behind fade edges, with the selected one kept in view.">
          <Editor />
        </Example>
        <Example caption="A limit, with a reason.">
          <Limited />
        </Example>
      </div>
    </div>
  );
}
