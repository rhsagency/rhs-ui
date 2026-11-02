"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { CreatableSelect, type CreatableOption, type CreatableSelectProps } from "@rhs-ui/primitives/creatable-select";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

const LABELS: readonly CreatableOption[] = [
  { value: "accessibility", label: "Accessibility" },
  { value: "bug", label: "Bug" },
  { value: "design-review", label: "Design review" },
  { value: "design-tokens", label: "Design tokens" },
  { value: "docs", label: "Documentation" },
  { value: "feature", label: "Feature request" },
  { value: "help", label: "Help wanted" },
  { value: "performance", label: "Performance" },
  { value: "security", label: "Security" },
];

const PROJECTS: readonly CreatableOption[] = [
  { value: "halcyon", label: "Halcyon" },
  { value: "kestrel", label: "Kestrel" },
  { value: "northwind", label: "Northwind" },
];

const slug = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** A pretend server: it takes a moment, and it refuses a name it keeps for itself. */
function saveLabel(name: string): Promise<CreatableOption> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (slug(name) === "admin") reject(new Error("“admin” is kept for the workspace. Pick another name."));
      else resolve({ value: slug(name), label: name });
    }, 900);
  });
}

/**
 * Holds the room a list that starts open needs, so the preview shows it whole and covers nothing. The room goes
 * back when the person uses what it holds (a press that ends in it, or a key in it), and never for a press
 * elsewhere on the page, or a swipe that scrolls it: a page that shrinks above a finger moves the very thing the
 * finger was about to tap.
 */
function Reserve({ className, children }: { className: string; children: ReactNode }): React.JSX.Element {
  const [reserved, setReserved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // A moment after the press ends, so that a control that moves away under the pointer still gets its click. A key sent by the demo itself is not use.
  const used = (event: SyntheticEvent) => {
    if (!event.nativeEvent.isTrusted) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReserved(false), 300);
  };
  return (
    <div onPointerUp={used} onKeyDown={used} className={cn("transition-[min-height] duration-200 ease-out motion-reduce:transition-none", reserved ? className : "min-h-0")}>
      {children}
    </div>
  );
}

/** Types a text into the search of the open list with this name, once, so the preview shows what the search brings. The focus is never touched. */
function Typed({ panel, text, children }: { panel: string; text: string; children: ReactNode }): React.JSX.Element {
  useEffect(() => {
    let tries = 0;
    const timer = window.setInterval(() => {
      const input = document.querySelector<HTMLInputElement>(`[role="dialog"][aria-label="${panel}"] [cmdk-input]`);
      tries += 1;
      if (!input && tries < 40) return;
      window.clearInterval(timer);
      if (!input) return;
      // React listens for the input event, and only sees a value that was set through the native setter.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, 50);
    return () => window.clearInterval(timer);
  }, [panel, text]);
  return <>{children}</>;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Omit for a type that is a union: it takes the keys out of each member, so one choice and several choices stay two shapes. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** The visible label also names the list, so what is seen and what is said are the same words. */
function Field({ label, ...props }: { label: string } & DistributiveOmit<CreatableSelectProps, "id" | "label">): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <CreatableSelect id={id} label={label} {...props} />
    </div>
  );
}

function Triage(): React.JSX.Element {
  const id = useId();
  const [labels, setLabels] = useState<string[]>(["bug", "accessibility"]);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Triage issue 1,284</h2>
        <p className="text-xs text-muted-foreground">Enter creates what you typed when nothing else matches, and Ctrl or Cmd with Enter always does. Try admin to see a refusal.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Labels</Label>
        <Reserve className="min-h-[13rem]">
          <Typed panel="Labels" text="Billing">
            <CreatableSelect
              id={id}
              label="Labels"
              name="labels"
              multiple
              options={LABELS}
              value={labels}
              onValueChange={setLabels}
              onCreate={saveLabel}
              defaultOpen
              placement="bottom"
            />
          </Typed>
        </Reserve>
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{JSON.stringify(labels).replace(/,/g, ", ")}</code>
      </p>
    </form>
  );
}

/** Validated the way a form does it: the field is invalid until one label is chosen, and the message under it is read with the field. */
function Required(): React.JSX.Element {
  const id = useId();
  const [labels, setLabels] = useState<string[]>([]);
  const invalid = labels.length === 0;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Release labels</Label>
      <div className="grid gap-1.5">
        <CreatableSelect
          id={id}
          label="Release labels"
          multiple
          required
          options={LABELS}
          value={labels}
          onValueChange={setLabels}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
        />
        <p id={`${id}-error`} role="status" className="text-xs leading-5 font-medium text-destructive empty:hidden">
          {invalid ? (
            <span className="flex items-start gap-1.5">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>Add at least one label before you save.</span>
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: the last row creates what you typed, and Backspace in the empty search takes back the last chip">
        <Triage />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="One choice: a project, with a server that takes its time to create one">
          <Field label="Project" options={PROJECTS} defaultValue="kestrel" onCreate={saveLabel} />
        </Example>
        <Example caption="Chips wrap, and each one has its own remove button">
          <Field label="Topics" multiple options={LABELS} defaultValue={["docs", "feature", "performance", "security", "help"]} />
        </Example>
        <Example caption="Nothing to list yet, so the first entry is created from the search">
          <Field label="Segments" multiple options={[]} placeholder="Create a segment" />
        </Example>
        <Example caption="Invalid until a label is added: the border and the message both say so">
          <Required />
        </Example>
        <Example caption="Disabled">
          <Field label="Locked labels" multiple disabled options={LABELS} defaultValue={["bug", "docs"]} />
        </Example>
      </div>
    </div>
  );
}
