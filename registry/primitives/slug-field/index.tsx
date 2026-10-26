"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconAlertCircle, IconLink, IconLock, IconUnlock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cleanSlugInput, nextFreeSlug, slugify } from "@rhs-ui/primitives/slug-field/slugify";
import { cn } from "@/lib/utils";

export interface SlugFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "maxLength" | "title"> {
  /** The title the slug follows until someone types in the slug field. */
  title: string;
  /** The slug, when you control it. A slug that is there when the field mounts counts as chosen, so the field starts locked; so does one that arrives later from outside, such as the saved slug of a record that loads after the form. */
  value?: string;
  /** The slug to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the slug on every change. `auto` is true while it is following the title and false once it has been typed. */
  onValueChange?: (slug: string, state: { auto: boolean }) => void;
  /** What the address starts with, for the preview under the field: "northwind.example/journal". */
  baseUrl?: string;
  /** The longest slug. Default 60. */
  maxLength?: number;
  /** Slugs that are already used. A slug that matches one is flagged in words, with the next free one as a button. */
  taken?: readonly string[];
}

// InputGroup keeps its neutral focus ring even on an invalid field; a clash keeps its error colour while someone is fixing it.
const STAYS_RED = "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30";

/**
 * A URL slug that writes itself. While nobody has typed in it, it follows the
 * `title` prop: lower case, accents removed, spaces to hyphens, cut at
 * `maxLength`. The first keystroke in the field locks it (a lock replaces the
 * link icon) and a "Follow title" button hands control back; so does emptying
 * the field and leaving it. Under the field a muted preview prints the whole
 * address, and a slug that is already `taken` is flagged in words with the next
 * free one offered. The `slugify` helper is exported from `slug-field/slugify`.
 */
export function SlugField({ title, value, defaultValue = "", onValueChange, baseUrl = "", maxLength = 60, taken = [], className, onBlur, placeholder, "aria-describedby": describedBy, ref, ...props }: SlugFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement | null>(null);
  // The field keeps the ref you pass and uses its own to put the focus back after Follow title or a suggestion.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const initial = value ?? defaultValue;
  const [locked, setLocked] = useState(initial !== "");
  const [own, setOwn] = useState(initial);
  const [synced, setSynced] = useState(value);
  const [said, setSaid] = useState("");
  // The last slug this field wrote while following the title, so that it can tell its own slug coming back as `value` from one that was chosen elsewhere.
  const reported = useRef<string | null>(null);

  // A slug that arrives from outside once the field is mounted (a record that loads after the form) was chosen by someone, like one that was there at the start,
  // and locks the field before anything is shown or reported. A slug that is only the one this field reported is not news, and an empty one is no choice.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (!locked && value !== "" && value !== reported.current) setLocked(true);
  }

  // What a screen reader was told stays only while it is news; the status region is read as a whole, so a stale sentence would be repeated with the next one.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  const derived = slugify(title, maxLength);
  const slug = locked ? (value ?? own) : derived;

  // While it follows the title, whoever owns the value hears about each new slug.
  useEffect(() => {
    if (locked || reported.current === derived) return;
    reported.current = derived;
    onValueChange?.(derived, { auto: true });
  }, [locked, derived]);

  function change(event: ChangeEvent<HTMLInputElement>) {
    const node = event.currentTarget;
    const { value: next, caret } = cleanSlugInput(node.value, node.selectionStart ?? node.value.length, maxLength);
    // The field is put right here, before React looks at it, so a key that is dropped does not throw the caret to the end.
    if (node.value !== next) {
      node.value = next;
      node.setSelectionRange(caret, caret);
    }
    reported.current = null;
    setLocked(true);
    setSaid("");
    if (value === undefined) setOwn(next);
    onValueChange?.(next, { auto: false });
  }

  /** Hands the slug back to the title. */
  function release() {
    reported.current = derived;
    setLocked(false);
    setOwn("");
    setSaid("The slug follows the title again.");
    onValueChange?.(derived, { auto: true });
  }

  function follow() {
    release();
    input.current?.focus();
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    if (!locked) return;
    const tidy = slug.replace(/-+$/g, "");
    // An emptied field has nothing of its own to keep: it goes back to following the title.
    if (tidy === "") {
      release();
      return;
    }
    if (tidy !== slug) {
      if (value === undefined) setOwn(tidy);
      onValueChange?.(tidy, { auto: false });
    }
  }

  function use(next: string) {
    reported.current = null;
    setLocked(true);
    if (value === undefined) setOwn(next);
    onValueChange?.(next, { auto: false });
    setSaid(`The slug is now ${next}.`);
    input.current?.focus();
  }

  const clash = slug !== "" && taken.some((entry) => entry.toLowerCase() === slug);
  const free = clash ? nextFreeSlug(slug, taken, maxLength) : null;
  const root = baseUrl.replace(/\/+$/, "");

  return (
    <div data-slot="slug-field" data-mode={locked ? "locked" : "auto"} className={cn("grid w-full", className)}>
      <InputGroup className={STAYS_RED}>
        <InputGroupAddon aria-hidden="true">{locked ? <IconLock /> : <IconLink />}</InputGroupAddon>
        <InputGroupInput
          ref={attach}
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...props}
          placeholder={locked && slug === "" && derived !== "" ? derived : placeholder}
          value={slug}
          onChange={change}
          onBlur={leave}
          aria-invalid={clash ? true : undefined}
          aria-describedby={[describedBy, `${id}-mode`, `${id}-address`, `${id}-status`].filter(Boolean).join(" ")}
        />
        {locked ? (
          <Button type="button" variant="ghost" size="sm" onClick={follow} disabled={props.disabled} className="mr-0.5 h-7 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
            <IconUnlock aria-hidden="true" />
            <span className="max-[22rem]:sr-only">Follow title</span>
          </Button>
        ) : (
          <InputGroupAddon aria-hidden="true" className="pr-3 text-xs">
            Auto
          </InputGroupAddon>
        )}
      </InputGroup>
      <span id={`${id}-mode`} className="sr-only">
        {locked ? "Typed by hand. It no longer follows the title." : "Follows the title as you type it."}
      </span>
      <p id={`${id}-address`} className="mt-1.5 text-xs text-muted-foreground tabular-nums [overflow-wrap:anywhere]">
        {root}/<span className={cn("transition-colors duration-150", slug ? "font-medium text-foreground" : "")}>{slug || "your-slug"}</span>
      </p>
      <div id={`${id}-status`} role="status">
        {clash ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            <span className="min-w-0 [overflow-wrap:anywhere]">
              “{slug}” is already used by another page.
              {free ? (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => use(free)}
                    className="-mx-0.5 rounded-sm px-0.5 text-left font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    Use {free}
                  </button>
                </>
              ) : null}
            </span>
          </p>
        ) : null}
        {said ? <span className="sr-only">{said}</span> : null}
      </div>
    </div>
  );
}
