"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { trackPress, whenReleased } from "@rhs-ui/primitives/name-field/blur-guard";
import { DEFAULT_PARTICLES, fixNameCase, joinName, splitName, tidyName, type NameParts } from "@rhs-ui/primitives/name-field/names";
import { cn } from "@/lib/utils";

export interface NameFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "name"> {
  /** The full name, when you control it. */
  value?: string;
  /** The name to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change with the name in one piece and in parts: `{ full, given, particle, family }`. */
  onValueChange?: (name: NameParts) => void;
  /** Show a "Split into parts" button that reveals fields for given name, particle and family name, for systems that need them. Default false. */
  splitable?: boolean;
  /** Start with the parts showing. Only with `splitable`. */
  defaultOpen?: boolean;
  /** The words that stay in lower case between a given name and a family name, in lower case. Default: van, von, der, de, la, du, del and the like. */
  particles?: readonly string[];
  /** The field's name for a plain form submit. With `splitable` the three parts go out too, as `name-given`, `name-particle` and `name-family`. */
  name?: string;
}

type Edited = Pick<NameParts, "given" | "particle" | "family">;

/**
 * One field for a person's name, because most people do not have exactly a
 * first and a last name. It takes a single name, accents, apostrophes and
 * hyphens, has no short length limit, and never asks for a split. When the
 * field is left it fixes only what is obviously wrong, a name typed all in
 * lower case or all in capitals, and keeps particles lower case ("van der
 * Berg") and mixed case such as McDonald as typed. The change is announced
 * politely and a small Undo restores exactly what was typed, and stays undone.
 * With `splitable` a disclosure reveals given name, particle and family name
 * fields; `onValueChange` reports both forms either way.
 */
export function NameField({ value, defaultValue = "", onValueChange, splitable = false, defaultOpen = false, particles = DEFAULT_PARTICLES, name, form, className, onBlur, "aria-describedby": describedBy, ref, ...props }: NameFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement | null>(null);
  // The field keeps the ref you pass and uses its own to put the focus back after Undo.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const [text, setText] = useState(value ?? defaultValue);
  const [synced, setSynced] = useState(value);
  const [edited, setEdited] = useState<Edited | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [note, setNote] = useState<{ before: string; after: string } | null>(null);
  const [declined, setDeclined] = useState<string | null>(null);
  const [said, setSaid] = useState("");

  // A name that arrives from outside replaces what is typed, unless it is only the tidy form of it.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== tidyName(text)) {
      setText(value);
      setEdited(null);
    }
  }

  useEffect(trackPress, []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  const parts: NameParts = edited ? { full: tidyName(text), ...edited } : splitName(text, particles);

  // What the parts hold while someone types in them keeps its spaces (the next word is on its way); what is reported and posted does not.
  function report(next: string, byHand: Edited | null) {
    onValueChange?.(byHand ? { full: tidyName(next), given: tidyName(byHand.given), particle: tidyName(byHand.particle), family: tidyName(byHand.family) } : splitName(next, particles));
  }

  function type(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setText(next);
    setEdited(null);
    setNote(null);
    setSaid("");
    report(next, null);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    const typed = text;
    if (typed === declined) return;
    const fixed = fixNameCase(typed, particles);
    if (fixed === typed) return;
    const recased = fixed !== tidyName(typed);
    setText(fixed);
    setEdited(null);
    if (recased) {
      report(fixed, null);
      whenReleased(() => {
        setNote({ before: typed, after: fixed });
        setSaid(`Name capitalised as ${fixed}.`);
      });
    }
  }

  function undo() {
    if (!note) return;
    setText(note.before);
    setDeclined(note.before);
    setEdited(null);
    setSaid(`Name restored as you typed it: ${note.before}.`);
    setNote(null);
    report(note.before, null);
    input.current?.focus();
  }

  function part(key: keyof Edited, next: string) {
    const byHand: Edited = { given: parts.given, particle: parts.particle, family: parts.family, [key]: next };
    const joined = joinName(byHand);
    setEdited(byHand);
    setText(joined);
    setNote(null);
    setSaid("");
    report(joined, byHand);
  }

  return (
    <div data-slot="name-field" className={cn("grid w-full", className)}>
      <Input
        ref={attach}
        type="text"
        autoComplete="name"
        spellCheck={false}
        form={form}
        name={name}
        {...props}
        value={text}
        onChange={type}
        onBlur={leave}
        aria-describedby={[describedBy, `${id}-note`].filter(Boolean).join(" ")}
      />
      <div id={`${id}-note`} aria-live="polite">
        {note ? (
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true">Capitalised for you.</span>
            <button
              type="button"
              onClick={undo}
              className="-mx-0.5 rounded-sm px-0.5 font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              Undo
            </button>
          </p>
        ) : null}
        {said ? <span className="sr-only">{said}</span> : null}
      </div>

      {splitable ? (
        <div className="mt-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-parts`}
            onClick={() => setOpen((now) => !now)}
            className="-ml-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <IconChevronDown aria-hidden="true" className={cn("size-3.5 transition-transform duration-150 motion-reduce:transition-none", open && "rotate-180")} />
            Split into parts
          </button>
          {open ? (
            <div id={`${id}-parts`} role="group" aria-label="Name in parts" className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1fr)]">
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-given`} className="text-xs">
                  Given name
                </Label>
                <Input id={`${id}-given`} autoComplete="given-name" spellCheck={false} value={parts.given} onChange={(event) => part("given", event.target.value)} disabled={props.disabled} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-particle`} className="text-xs">
                  Particle
                </Label>
                <Input id={`${id}-particle`} autoComplete="off" spellCheck={false} placeholder="van der" value={parts.particle} onChange={(event) => part("particle", event.target.value)} disabled={props.disabled} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-family`} className="text-xs">
                  Family name
                </Label>
                <Input id={`${id}-family`} autoComplete="family-name" spellCheck={false} value={parts.family} onChange={(event) => part("family", event.target.value)} disabled={props.disabled} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {splitable && name ? (
        <>
          <input type="hidden" name={`${name}-given`} form={form} value={tidyName(parts.given)} disabled={props.disabled} />
          <input type="hidden" name={`${name}-particle`} form={form} value={tidyName(parts.particle)} disabled={props.disabled} />
          <input type="hidden" name={`${name}-family`} form={form} value={tidyName(parts.family)} disabled={props.disabled} />
        </>
      ) : null}
    </div>
  );
}
