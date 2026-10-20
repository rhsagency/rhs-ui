"use client";

import { useState, type ReactNode } from "react";

import { IconArchive, IconTrash, IconUpload, IconUserMinus } from "@rhs-ui/icons";
import { HoldToConfirmButton } from "@rhs-ui/primitives/hold-to-confirm-button";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState<string[]>([]);
  const confirmed = (what: string) => () => setLog((previous) => [what, ...previous].slice(0, 3));

  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Press and hold, with the mouse, a finger, or Space and Enter. Letting go early rolls the fill back.">
          <section aria-labelledby="danger-title" className="w-full rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <div className="max-w-md min-w-0 space-y-1">
                <h3 id="danger-title" className="text-sm font-semibold tracking-[-0.01em]">
                  Delete workspace
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">Permanently removes Halcyon Studio with its 14 projects and 3 members. This cannot be undone.</p>
              </div>
              <HoldToConfirmButton tone="destructive" icon={<IconTrash />} label="Hold to delete workspace" confirmedLabel="Workspace deleted" onConfirm={confirmed("Deleted workspace Halcyon Studio")} />
            </div>
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground" aria-live="polite">
              {log.length ? `Confirmed: ${log[0]}.` : "Nothing confirmed yet. A quick press shows the other way: press again within three seconds."}
            </p>
          </section>
        </Example>
      </div>

      <Example caption="The default tone fills with the foreground colour">
        <HoldToConfirmButton icon={<IconUpload />} label="Hold to publish release 4.2" confirmedLabel="Release published" duration={1000} onConfirm={confirmed("Published release 4.2")} />
      </Example>

      <Example caption="Soft, small, and a shorter hold of 800 ms">
        <HoldToConfirmButton tone="destructive" variant="soft" size="sm" icon={<IconUserMinus />} label="Hold to remove Priya" confirmedLabel="Priya removed" duration={800} onConfirm={confirmed("Removed Priya Nair")} />
      </Example>

      {/* The three buttons are about 570px wide with their gaps: a row of their own, so the large one does not drop below the others. */}
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Three sizes">
          <div className="flex flex-wrap items-center gap-3">
            <HoldToConfirmButton size="sm" icon={<IconArchive />} label="Hold to archive" confirmedLabel="Archived" onConfirm={confirmed("Archived 3 projects (small)")} />
            <HoldToConfirmButton size="md" icon={<IconArchive />} label="Hold to archive" confirmedLabel="Archived" onConfirm={confirmed("Archived 3 projects (medium)")} />
            <HoldToConfirmButton size="lg" icon={<IconArchive />} label="Hold to archive" confirmedLabel="Archived" onConfirm={confirmed("Archived 3 projects (large)")} />
          </div>
        </Example>
      </div>

      <Example caption="Disabled stays disabled">
        <HoldToConfirmButton disabled icon={<IconTrash />} tone="destructive" label="Hold to delete workspace" onConfirm={confirmed("never")} />
      </Example>
    </div>
  );
}
