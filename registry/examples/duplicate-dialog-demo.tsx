"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { DuplicateDialog, DuplicatePanel, type DuplicateOption, type DuplicateValues } from "@rhs-ui/application/duplicate-dialog";
import { IconCopy, IconUsers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A name as an address segment: lower case, words joined with hyphens, none at either end. */
const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const OPTIONS: readonly DuplicateOption[] = [
  { id: "tasks", label: "Tasks", count: 48, unit: { one: "task", other: "tasks" }, defaultChecked: true },
  { id: "files", label: "Files", count: 12, unit: { one: "file", other: "files" }, defaultChecked: true },
  { id: "comments", label: "Comments", count: 214, unit: { one: "comment", other: "comments" } },
  { id: "members", label: "Members", count: 5, unit: { one: "member", other: "members" } },
  { id: "automations", label: "Automations", count: 3, unit: { one: "automation", other: "automations" }, disabled: true, reason: "Needs the Business plan" },
];

export default function Demo(): React.JSX.Element {
  const [names, setNames] = useState(["Halcyon launch", "Halcyon launch (copy)", "Kestrel mobile app"]);
  const [made, setMade] = useState("");
  const tries = useRef(0);

  // The first attempt fails, to show that the form stays as it was and the button says "Try again".
  const duplicate = async ({ name, include }: DuplicateValues) => {
    await wait(1100);
    if (tries.current++ === 0) throw new Error("The workspace is at its limit of 25 projects. Archive one, or upgrade, and try again.");
    setNames((list) => [...list, name]);
    setMade(`Created “${name}” with ${include.length} kinds of content.`);
    // A hash, so the link in the Copy created panel stays on this page; an app resolves with the real address of the new project.
    return `#/projects/${slugOf(name)}`;
  };

  return (
    <div className="grid w-full gap-10">
      <Case caption="Duplicate Halcyon launch. “Halcyon launch (copy)” is already taken, so the name starts as (copy 2); type a taken name and a way out appears. The first attempt fails and keeps everything, the second works.">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-card px-4 py-4 text-card-foreground shadow-xs sm:px-5">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-5">
            <IconCopy />
          </span>
          <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
            <h2 className="text-sm font-semibold tracking-[-0.01em]">Halcyon launch</h2>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
              <span>48 tasks</span>
              <span aria-hidden="true">·</span>
              <span>12 files</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <IconUsers aria-hidden="true" className="size-3.5" />5 members
              </span>
            </p>
          </div>
          <DuplicateDialog
            trigger={
              <Button variant="outline">
                <IconCopy />
                Duplicate
              </Button>
            }
            kind="project"
            sourceName="Halcyon launch"
            options={OPTIONS}
            existingNames={names}
            onDuplicate={duplicate}
          />
        </div>
        <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
          {made}
        </p>
      </Case>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
        <Case caption="Ready. What comes along is ticked, how much of each is on the row, and the foot says what will happen.">
          <Surface>
            <DuplicatePanel standalone kind="project" sourceName="Halcyon launch" options={OPTIONS} existingNames={names.slice(0, 1)} onDuplicate={() => undefined} />
          </Surface>
        </Case>
        <Case caption="Working. The fields lock, the button shows progress, and the dialog around it will not close.">
          <Surface>
            <Sent>
              <DuplicatePanel standalone kind="project" sourceName="Halcyon launch" options={OPTIONS} existingNames={names.slice(0, 1)} onDuplicate={() => new Promise<void>(() => undefined)} />
            </Sent>
          </Surface>
        </Case>
        <Case caption="Failed. The name and the ticks are still here, so nothing has to be retyped, and the button now says Try again.">
          <Surface>
            <Sent>
              <DuplicatePanel
                standalone
                kind="project"
                sourceName="Halcyon launch"
                options={OPTIONS}
                existingNames={names.slice(0, 1)}
                onDuplicate={() => Promise.reject(new Error("The workspace is at its limit of 25 projects. Archive one, or upgrade, and try again."))}
              />
            </Sent>
          </Surface>
        </Case>
        <Case caption="Done. The form gives way to Copy created and a link to the copy, and focus moves to it.">
          <Surface>
            <Sent>
              <DuplicatePanel standalone kind="project" sourceName="Halcyon launch" options={OPTIONS} existingNames={names.slice(0, 1)} onDuplicate={() => Promise.resolve("#/projects/halcyon-launch-copy")} />
            </Sent>
          </Surface>
        </Case>
      </div>
    </div>
  );
}

/**
 * Presses the panel's own button once it is on screen, so a preview shows the state after a press. Nobody pressed it, so the page keeps
 * its place and its focus: wherever the panel moves focus while it settles (the button, the name after a failure, the way on after a
 * success) is let go of again, until somebody touches the preview.
 */
function Sent({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const letGo = (event: FocusEvent) => (event.target as HTMLElement).blur();
    const stop = () => element.removeEventListener("focusin", letGo);
    element.addEventListener("focusin", letGo);
    const timer = window.setTimeout(stop, 1000);
    document.addEventListener("pointerdown", stop, { capture: true, once: true });
    document.addEventListener("keydown", stop, { capture: true, once: true });
    element.querySelector("form")?.requestSubmit();
    return () => {
      window.clearTimeout(timer);
      stop();
      document.removeEventListener("pointerdown", stop, { capture: true });
      document.removeEventListener("keydown", stop, { capture: true });
    };
  }, []);
  return <div ref={box}>{children}</div>;
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
  return <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm">{children}</div>;
}
