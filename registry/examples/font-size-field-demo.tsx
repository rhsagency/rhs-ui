"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

import { IconBold, IconItalic, IconUnderline } from "@rhs-ui/icons";
import { FontSizeField } from "@rhs-ui/primitives/font-size-field";
import { Label } from "@rhs-ui/primitives/label";
import { Toggle } from "@rhs-ui/primitives/toggle";
import { cn } from "@/lib/utils";

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

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A toolbar the way an editor draws it: the size field is one stop among the formatting buttons. */
function Headline(): React.JSX.Element {
  const id = useId();
  const [size, setSize] = useState(24);
  const [marks, setMarks] = useState<string[]>(["bold"]);
  const mark = (name: string) => (on: boolean) => setMarks((list) => (on ? [...list, name] : list.filter((item) => item !== name)));
  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Format the Halcyon headline</h2>
        <p className="text-xs text-muted-foreground">Pick a size from the list, or type one and press Enter.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Headline size</Label>
        <div role="group" aria-label="Text formatting" className="@container flex flex-wrap items-center gap-x-1 gap-y-2">
          <FontSizeField id={id} label="Headline size" value={size} onValueChange={setSize} name="headline-size" />
          {/* The divider and the three toggles wrap together; where the toolbar is narrow enough to wrap, the divider is left out, so it never stands at the start of a row. */}
          <div className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border @max-[20rem]:hidden" />
            <Toggle aria-label="Bold" pressed={marks.includes("bold")} onPressedChange={mark("bold")}>
              <IconBold />
            </Toggle>
            <Toggle aria-label="Italic" pressed={marks.includes("italic")} onPressedChange={mark("italic")}>
              <IconItalic />
            </Toggle>
            <Toggle aria-label="Underline" pressed={marks.includes("underline")} onPressedChange={mark("underline")}>
              <IconUnderline />
            </Toggle>
          </div>
        </div>
      </div>
      <div className="flex min-h-24 items-center overflow-hidden rounded-lg bg-muted/50 px-4 py-3">
        <p
          style={{ fontSize: `${size}px` }}
          className={cn("leading-tight tracking-[-0.02em] [overflow-wrap:anywhere] text-foreground", marks.includes("bold") && "font-semibold", marks.includes("italic") && "italic", marks.includes("underline") && "underline underline-offset-4")}
        >
          Quarterly report
        </p>
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{size}</code>
      </p>
    </div>
  );
}

/** The visible label is also the name a screen reader reads, so what is seen and what is said are the same words. */
function Field({ label, ...props }: { label: string } & Omit<React.ComponentProps<typeof FontSizeField>, "id" | "label">): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid justify-items-start gap-2">
      <Label htmlFor={id}>{label}</Label>
      <FontSizeField id={id} label={label} {...props} />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: the arrow keys walk the ladder, Shift adds one, Alt and the down arrow open the list">
        <Headline />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="The list of common sizes, open">
          <Reserve className="min-h-[17.5rem]">
            <Field label="Body size" defaultValue={16} defaultOpen placement="bottom" />
          </Reserve>
        </Example>
        <Example caption="Points, with a ladder and limits of its own">
          <Field label="Print size" unit="pt" sizes={[8, 9, 10, 11, 12, 14, 18, 24, 36]} defaultValue={11} min={6} max={96} />
        </Example>
        <Example caption="At a limit the button that would go further switches off">
          <Field label="Caption size" defaultValue={32} max={32} />
        </Example>
        <Example caption="Disabled">
          <Field label="Brand kit size" disabled defaultValue={18} />
        </Example>
      </div>
    </div>
  );
}
