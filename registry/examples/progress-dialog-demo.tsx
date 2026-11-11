"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconArchive, IconDownload, IconExternal, IconGlobe, IconUsers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ProgressDialog, type ProgressDialogStatus } from "@rhs-ui/primitives/progress-dialog";

export default function Demo(): React.JSX.Element {
  const [jobs, setJobs] = useState<Record<JobId, Job>>({ export: IDLE, import: IDLE, publish: IDLE });
  const [shown, setShown] = useState<JobId>("export");
  const [open, setOpen] = useState(false);
  /** Jobs whose cancel was confirmed: they stop moving while the cancel is carried out. */
  const cancelling = useRef(new Set<JobId>());
  const running = Object.values(jobs).some((job) => job.status === "running");

  // One clock for every job that is running. It stops when none is.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setJobs((all) => {
        const next = { ...all };
        for (const id of Object.keys(all) as JobId[]) {
          const job = all[id];
          if (job.status !== "running" || cancelling.current.has(id)) continue;
          const plan = JOBS[id];
          const progress = Math.min(1, job.progress + 0.06);
          const ticks = job.ticks + 1;
          if (plan.failAt !== undefined && job.attempt === 1 && progress >= plan.failAt) next[id] = { ...job, status: "failed", progress: plan.failAt, ticks };
          else if (plan.determinate ? progress >= 1 : ticks >= 14) next[id] = { ...job, status: "done", progress: 1, ticks };
          else next[id] = { ...job, progress, ticks };
        }
        return next;
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [running]);

  function start(id: JobId) {
    cancelling.current.delete(id);
    setJobs((all) => ({ ...all, [id]: { status: "running", progress: 0, ticks: 0, attempt: all[id].attempt + 1 } }));
    setShown(id);
    setOpen(true);
  }

  function reopen(id: JobId) {
    setShown(id);
    setOpen(true);
  }

  const current = jobs[shown];
  const plan = JOBS[shown];

  return (
    <div className="grid w-full max-w-xl gap-3">
      {/* One dialog for every job: what it shows follows the status you give it. */}
      <ProgressDialog
        open={open}
        onOpenChange={setOpen}
        title={plan.heading}
        description={plan.line}
        status={current.status === "idle" ? "running" : current.status}
        progress={plan.determinate ? current.progress : undefined}
        stepLabel={stepOf(shown, current)}
        onCancel={() => {
          const id = shown;
          cancelling.current.add(id);
          window.setTimeout(() => {
            cancelling.current.delete(id);
            setJobs((all) => ({ ...all, [id]: { ...all[id], status: "cancelled" } }));
          }, 1200);
        }}
        onBackground={() => setOpen(false)}
        result={resultOf(shown)}
        error={shown === "publish" ? "The edge network refused the upload (error 503). Nothing was published, and your live site is unchanged." : undefined}
        onRetry={shown === "publish" ? () => start(shown) : undefined}
        labels={{ doneTitle: plan.ended.done, failedTitle: plan.ended.failed, cancelledTitle: plan.ended.cancelled, cancelTitle: plan.ended.ask }}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">Start a job, then try Cancel, Continue in background, or Escape (which does nothing while it runs). The publish job fails the first time.</p>
      <ul className="m-0 grid list-none divide-y divide-border overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xs">
        {(Object.keys(JOBS) as JobId[]).map((id) => {
          const job = jobs[id];
          const info = JOBS[id];
          const background = job.status === "running" && !(open && shown === id);
          const line = {
            idle: info.line,
            running: info.determinate ? `Running, ${Math.round(job.progress * 100)}%` : "Running",
            done: "Finished just now",
            failed: "Failed, can be run again",
            cancelled: "Cancelled",
          }[job.status];
          return (
            <li key={id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-[1.125rem]">
                {info.icon}
              </span>
              <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
                <p className="text-sm font-medium">{info.name}</p>
                <p className="text-sm text-muted-foreground tabular-nums">{line}</p>
              </div>
              {job.status === "idle" || job.status === "cancelled" ? (
                <Button type="button" variant="outline" onClick={() => start(id)}>
                  {job.status === "idle" ? info.start : "Start again"}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => reopen(id)}>
                  {background ? "Show progress" : job.status === "done" ? "See result" : job.status === "failed" ? "See details" : "Show progress"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

    </div>
  );
}

type JobId = "export" | "import" | "publish";

interface Job {
  status: ProgressDialogStatus | "idle";
  /** From 0 to 1; unused by a job whose end is unknown. */
  progress: number;
  ticks: number;
  attempt: number;
}

const IDLE: Job = { status: "idle", progress: 0, ticks: 0, attempt: 0 };

/** What each job is called, how it speaks while it runs and how its result looks. The publish job fails the first time, to show the way back. */
const JOBS: Record<JobId, { icon: ReactNode; name: string; heading: string; line: string; start: string; ended: { done: string; failed: string; cancelled: string; ask: string }; determinate: boolean; failAt?: number }> = {
  export: {
    icon: <IconArchive />,
    name: "Export orders",
    heading: "Exporting orders",
    line: "3,482 orders from October, as CSV files in one archive",
    start: "Start export",
    ended: { done: "Export ready", failed: "Export failed", cancelled: "Export cancelled", ask: "Cancel the export?" },
    determinate: true,
  },
  import: {
    icon: <IconUsers />,
    name: "Import contacts",
    heading: "Importing contacts",
    line: "contacts-2026.csv, 12,400 rows",
    start: "Start import",
    ended: { done: "Import finished", failed: "Import failed", cancelled: "Import cancelled", ask: "Cancel the import?" },
    determinate: false,
  },
  publish: {
    icon: <IconGlobe />,
    name: "Publish storefront",
    heading: "Publishing the storefront",
    line: "Halcyon storefront, 42 pages",
    start: "Publish",
    ended: { done: "Storefront published", failed: "Publishing failed", cancelled: "Publishing cancelled", ask: "Cancel publishing?" },
    determinate: true,
    failAt: 0.7,
  },
};

function stepOf(id: JobId, job: Job): string {
  if (id === "export") return job.progress < 0.1 ? "Collecting 3,482 orders" : job.progress > 0.92 ? "Uploading the archive" : `Compressing ${Math.min(12, Math.ceil(job.progress * 12))} of 12 files`;
  if (id === "import") return job.ticks < 3 ? "Reading the file" : job.ticks < 8 ? "Matching 12,400 rows to your contacts" : "Saving the new contacts";
  return job.progress < 0.4 ? "Building 42 pages" : job.progress < 0.7 ? "Optimising images" : "Uploading to the edge";
}

function resultOf(id: JobId): ReactNode {
  const file = (name: string, detail: string, action: ReactNode) => (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
      <div className="grid min-w-0 gap-0.5">
        <p className="truncate font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {action}
    </div>
  );
  if (id === "export")
    return file(
      "orders-2026-10.zip",
      "24.1 MB, 12 files",
      <Button type="button" variant="outline" size="sm">
        <IconDownload />
        Download
      </Button>,
    );
  if (id === "import")
    return file(
      "12,380 contacts added",
      "20 rows skipped as duplicates",
      <Button type="button" variant="outline" size="sm">
        Review
      </Button>,
    );
  return file(
    "Live at halcyon.example",
    "Published 42 pages in 38 seconds",
    <Button type="button" variant="outline" size="sm">
      Visit
      <IconExternal />
    </Button>,
  );
}
