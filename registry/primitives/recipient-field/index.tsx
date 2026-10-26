"use client";

import { useEffect, useId, useRef, useState, type ClipboardEvent, type ComponentProps, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";

import { IconAlertCircle, IconClose, IconInfo } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import {
  chipText,
  DEFAULT_LABELS,
  initialsFor,
  isEmail,
  parseRecipient,
  rankContacts,
  splitRecipients,
  type Recipient,
  type RecipientLabels,
} from "@rhs-ui/primitives/recipient-field/recipients";
import { cn } from "@/lib/utils";

export type { Recipient, RecipientLabels } from "@rhs-ui/primitives/recipient-field/recipients";

export interface RecipientFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "role"> {
  /** The people on the line, when you control it. Chips whose address failed the check are in it too: nothing is dropped. */
  value?: readonly Recipient[];
  /** The people to start with, when you do not control it. */
  defaultValue?: readonly Recipient[];
  /** Called when a chip is added, edited or removed, with the whole line and `valid`, false while some address fails the check. `invalid` lists those that do. */
  onValueChange?: (value: Recipient[], state: { valid: boolean; invalid: Recipient[] }) => void;
  /** Who can be suggested while typing: a name, an address, or both. People already on the line are left out. */
  contacts?: readonly Recipient[];
  /** The most people on the line. Beyond it nothing is added, and the field says so. Default: no limit. */
  max?: number;
  /** Your own check of an address. Return true or nothing when it is fine, false for the default reason, or the reason in words ("Only Northwind addresses"). Replaces the default check. */
  validate?: (email: string) => boolean | string | void;
  /** The word in front of the line, and the name of the field. Default "To". */
  label?: string;
  /** Keep `label` for assistive technology only. */
  hideLabel?: boolean;
  /** What the empty field says. */
  placeholder?: string;
  /** The field's name for a plain form submit: the addresses that passed the check, joined by commas. */
  name?: string;
  /** Dim the field and stop it responding. */
  disabled?: boolean;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<RecipientLabels>;
}

/** The part of a text that matched what was typed, in bold. */
function Marked({ text, range }: { text: string; range: [number, number] | null }) {
  if (!range) return text;
  return (
    <>
      {text.slice(0, range[0])}
      <span className="font-semibold text-foreground">{text.slice(range[0], range[1])}</span>
      {text.slice(range[1])}
    </>
  );
}

type Pending = { to: "chip"; index: number } | { to: "input"; select?: boolean } | null;

/**
 * The To line of a message. Type a name or an address and pick a contact from
 * the list, or press Enter, comma or semicolon to keep what you typed; paste a
 * whole list (commas, semicolons, line breaks, "Name <address>") and every
 * entry becomes its own chip. An address that fails the check is not thrown
 * away: it stays as a chip with a warning icon, a dashed edge and the reason
 * in words under the field, and a click or Enter on it puts the text back in
 * the field to be fixed. Chips are reached with the arrow keys (Left from the
 * start of the text, or Backspace in an empty field), removed with Delete or
 * Backspace, and edited with Enter. Duplicates and a full line are said, never
 * silently ignored. It is more than a Tag input with an email check: it knows
 * people, not strings.
 */
export function RecipientField({
  value,
  defaultValue = [],
  onValueChange,
  contacts = [],
  max,
  validate,
  label = "To",
  hideLabel = false,
  placeholder = "Add a name or an address",
  name,
  disabled,
  labels: labelOverrides,
  className,
  ...props
}: RecipientFieldProps) {
  const base = useId();
  const inputId = `${base}-input`;
  const labelId = `${base}-label`;
  const listId = `${base}-list`;
  const hintId = `${base}-hint`;
  const inputHintId = `${base}-input-hint`;
  const optionId = (index: number) => `${base}-option-${index}`;
  const labels: RecipientLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState<readonly Recipient[]>(defaultValue);
  const list = value ?? own;
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [said, setSaid] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  // Where the focus goes once the chips have been redrawn.
  const pending = useRef<Pending>(null);
  const limit = max ?? Number.POSITIVE_INFINITY;

  /** Why an address is not good, in words, or null when it is. */
  function reasonOf(email: string): string | null {
    if (!validate) return isEmail(email) ? null : labels.invalid;
    const result = validate(email);
    return result === undefined || result === true ? null : result === false || result === "" ? labels.invalid : result;
  }

  const rows = list.map((person) => ({ person, reason: reasonOf(person.email) }));
  const broken = rows.filter((row) => row.reason !== null);
  const taken = new Set(list.map((person) => person.email.toLowerCase()));
  const matches = rankContacts(contacts, text, taken, 6);
  const showList = open && matches.length > 0 && !disabled;

  // The number of suggestions is said when the panel opens and when typing changes it, and then forgotten.
  useEffect(() => {
    if (showList) setSaid(labels.suggestionCount(matches.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- said when the list opens or its length changes, not when the wording does
  }, [showList, matches.length]);
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(null), 5000);
    return () => window.clearTimeout(timer);
  }, [note]);
  // The highlighted suggestion is kept in view when the list scrolls.
  useEffect(() => {
    if (active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId is rebuilt on every render and only depends on the id
  }, [active]);

  // Once the chips are redrawn, the focus goes where the last action wanted it.
  useEffect(() => {
    const target = pending.current;
    if (!target) return;
    pending.current = null;
    if (target.to === "input") {
      input.current?.focus();
      if (target.select) input.current?.select();
    } else {
      const chips = root.current?.querySelectorAll<HTMLButtonElement>("[data-recipient-chip]");
      const chip = chips?.[Math.min(target.index, (chips?.length ?? 1) - 1)];
      if (chip) chip.focus();
      else input.current?.focus();
    }
  });

  function write(next: Recipient[]) {
    if (value === undefined) setOwn(next);
    const bad = next.filter((person) => reasonOf(person.email) !== null);
    onValueChange?.(next, { valid: bad.length === 0, invalid: bad });
  }

  /** Put these people on the line: contacts give a typed address its name, duplicates and the limit are said, nothing is dropped without a word. */
  function addMany(incoming: Recipient[]) {
    const next = [...list];
    const seen = new Set(taken);
    const known = new Map(contacts.map((contact) => [contact.email.toLowerCase(), contact]));
    const added: Recipient[] = [];
    let duplicate: string | null = null;
    let skipped = 0;
    for (const raw of incoming) {
      const contact = known.get(raw.email.toLowerCase());
      const person: Recipient = raw.name || !contact?.name ? raw : { ...raw, name: contact.name };
      const key = person.email.toLowerCase();
      if (seen.has(key)) {
        duplicate ??= person.email;
        continue;
      }
      if (next.length >= limit) {
        skipped += 1;
        continue;
      }
      seen.add(key);
      next.push(person);
      added.push(person);
    }
    if (added.length) {
      write(next);
      setSaid(added.length === 1 ? labels.added(chipText(added[0] as Recipient), next.length) : labels.addedMany(added.length, next.length));
    }
    if (skipped) setNote(added.length ? labels.partlyAdded(added.length, incoming.length, limit) : labels.full(limit));
    else if (duplicate) setNote(labels.duplicate(duplicate));
  }

  function commitText() {
    const entries = splitRecipients(text).flatMap((entry) => parseRecipient(entry) ?? []);
    setText("");
    setActive(-1);
    setOpen(false);
    if (entries.length) addMany(entries);
  }

  function accept(index: number) {
    const match = matches[index];
    if (!match) return;
    setText("");
    setActive(-1);
    setOpen(false);
    addMany([match.contact]);
    input.current?.focus();
  }

  function removeAt(index: number, how: "keyboard" | "pointer") {
    const gone = list[index];
    if (!gone) return;
    const next = list.filter((_, at) => at !== index);
    write(next);
    setSaid(labels.removed(chipText(gone), next.length));
    pending.current = how === "keyboard" && next.length ? { to: "chip", index } : { to: "input" };
  }

  /** The chip goes back into the field as text, to be fixed in place. */
  function edit(index: number) {
    const person = list[index];
    if (!person) return;
    write(list.filter((_, at) => at !== index));
    setText(person.email);
    setOpen(false);
    pending.current = { to: "input", select: true };
  }

  function focusChip(index: number) {
    root.current?.querySelectorAll<HTMLButtonElement>("[data-recipient-chip]")[index]?.focus();
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      if (matches.length === 0) return;
      event.preventDefault();
      const last = matches.length - 1;
      if (!showList) {
        setOpen(true);
        setActive(key === "ArrowDown" ? 0 : last);
        return;
      }
      // The highlight goes round: from the last suggestion back to the text, and from the text to the first.
      setActive(key === "ArrowDown" ? (active >= last ? -1 : active + 1) : active <= -1 ? last : active - 1);
    } else if (key === "Enter") {
      if (showList && active >= 0) {
        event.preventDefault();
        accept(active);
      } else if (text.trim()) {
        event.preventDefault();
        commitText();
      }
    } else if (key === "," || key === ";") {
      event.preventDefault();
      if (text.trim()) commitText();
    } else if (key === "Escape" && showList) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if (list.length > 0 && (key === "Backspace" ? text === "" : key === "ArrowLeft" && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0)) {
      event.preventDefault();
      focusChip(list.length - 1);
    }
  }

  function chipKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.nativeEvent.isComposing) return;
    const { key } = event;
    if (key === "ArrowLeft") focusChip(Math.max(0, index - 1));
    else if (key === "ArrowRight") (index >= list.length - 1 ? input.current : root.current?.querySelectorAll<HTMLButtonElement>("[data-recipient-chip]")[index + 1])?.focus();
    else if (key === "Home") focusChip(0);
    else if (key === "End" || key === "Escape") input.current?.focus();
    else if (key === "Backspace" || key === "Delete") removeAt(index, "keyboard");
    else if (key === "Enter" || key === "F2") edit(index);
    else return;
    event.preventDefault();
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    const entries = splitRecipients(pasted);
    // A single address stays in the field to be finished; a list, or an entry that ends with a sign, becomes chips at once.
    if (entries.length < 2 && !/[,;\r\n]\s*$/.test(pasted)) return;
    event.preventDefault();
    addMany(entries.flatMap((entry) => parseRecipient(entry) ?? []));
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    if (root.current?.contains(event.relatedTarget as Node | null)) return;
    if (text.trim()) commitText();
    setOpen(false);
    setActive(-1);
  }

  function pressField(event: MouseEvent<HTMLDivElement>) {
    // A press on the empty part of the field is a press on the text.
    if (event.target === event.currentTarget) {
      event.preventDefault();
      input.current?.focus();
    }
  }

  const first = broken[0];

  return (
    <div ref={root} data-slot="recipient-field" className={cn("grid w-full min-w-0 grid-cols-1", className)} {...props}>
      <Popover
        open={showList}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
            setActive(-1);
          }
        }}
      >
        <PopoverAnchor asChild>
          <div
            ref={field}
            role="group"
            aria-labelledby={labelId}
            aria-disabled={disabled || undefined}
            onMouseDown={pressField}
            className={cn(
              "flex min-h-9 w-full cursor-text flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md border border-input bg-background px-2.5 py-1 text-sm shadow-xs transition-[border-color,box-shadow] duration-150",
              "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <label id={labelId} htmlFor={inputId} className={cn("mr-0.5 shrink-0 text-sm text-muted-foreground select-none", hideLabel && "sr-only")}>
              {label}
            </label>
            {rows.map(({ person, reason }, index) => {
              const shown = chipText(person);
              return (
                <span
                  key={person.email.toLowerCase()}
                  data-slot="recipient-chip"
                  data-invalid={reason ? "" : undefined}
                  className={cn(
                    "inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-full border py-0.5 pr-0.5 pl-1 text-[0.8125rem] transition-colors duration-150",
                    "has-[button:focus-visible]:border-ring has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/40",
                    reason ? "border-dashed border-destructive/70 bg-background" : "border-transparent bg-muted hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_6%)]",
                  )}
                >
                  {reason ? (
                    <IconAlertCircle aria-hidden="true" className="size-4 shrink-0 text-destructive" />
                  ) : (
                    <Avatar aria-hidden="true" className="shrink-0 bg-background ring-1 ring-border data-[size=default]:size-5">
                      <AvatarFallback className="bg-background text-[0.5625rem] font-semibold text-foreground">{initialsFor(person)}</AvatarFallback>
                    </Avatar>
                  )}
                  <button
                    type="button"
                    data-recipient-chip=""
                    tabIndex={-1}
                    aria-label={reason ? `${person.email}, ${reason}` : person.name ? `${person.name}, ${person.email}` : person.email}
                    title={reason ?? (person.name ? person.email : undefined)}
                    aria-describedby={hintId}
                    onKeyDown={(event) => chipKey(event, index)}
                    onClick={() => {
                      if (reason) edit(index);
                    }}
                    onDoubleClick={() => edit(index)}
                    className={cn("min-w-0 cursor-default truncate rounded-sm px-0.5 outline-none", reason && "cursor-pointer underline decoration-destructive/50 decoration-dotted underline-offset-4 active:translate-y-px")}
                  >
                    {shown}
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`${labels.remove} ${shown}`}
                    onClick={() => removeAt(index, "pointer")}
                    // The circle is 20px; the invisible edge around it makes the target 28px, the height of the chip, for a finger.
                    className="relative grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-background hover:text-foreground active:translate-y-px"
                  >
                    <IconClose aria-hidden="true" className="size-3" />
                  </button>
                </span>
              );
            })}
            <input
              ref={input}
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={showList}
              aria-controls={showList ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
              aria-describedby={inputHintId}
              inputMode="email"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="done"
              disabled={disabled}
              placeholder={list.length ? undefined : placeholder}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setActive(-1);
                setOpen(event.target.value.trim() !== "");
              }}
              onKeyDown={keyDown}
              onPaste={paste}
              onBlur={leave}
              className="h-6 w-0 min-w-12 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          role="presentation"
          align="start"
          collisionPadding={8}
          className="w-(--radix-popover-trigger-width) min-w-64 p-1"
          // The focus stays in the field the whole time: the panel is read through aria-activedescendant, never entered.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (field.current?.contains(event.target as Node)) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            setOpen(false);
            setActive(-1);
          }}
          // A press on a suggestion would move the focus out of the field and close the panel before the click lands.
          onMouseDown={(event) => event.preventDefault()}
        >
          <ul id={listId} role="listbox" aria-label={labels.suggestions} className="relative max-h-72 overflow-y-auto">
            {matches.map((match, index) => (
              <li
                key={match.contact.email}
                id={optionId(index)}
                role="option"
                aria-selected={active === index}
                data-active={active === index || undefined}
                onMouseMove={() => setActive(index)}
                onClick={() => accept(index)}
                className="flex min-h-11 cursor-default items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors duration-100 data-[active]:bg-muted"
              >
                <Avatar aria-hidden="true" size="sm" className="shrink-0">
                  <AvatarFallback>{initialsFor(match.contact)}</AvatarFallback>
                </Avatar>
                <span className="grid min-w-0">
                  {match.contact.name ? (
                    <>
                      <span className="truncate font-medium">
                        <Marked text={match.contact.name} range={match.inName} />
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        <Marked text={match.contact.email} range={match.inEmail} />
                      </span>
                    </>
                  ) : (
                    <span className="truncate">
                      <Marked text={match.contact.email} range={match.inEmail} />
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      <div aria-live="polite">
        {note ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
            <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {note}
          </p>
        ) : null}
        {first ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive [overflow-wrap:anywhere]">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {labels.problems(broken.length, first.person.email, first.reason ?? labels.invalid)}
          </p>
        ) : null}
      </div>
      <span id={hintId} className="sr-only">
        {labels.chipHint}
      </span>
      <span id={inputHintId} className="sr-only">
        {labels.inputHint}
      </span>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? <input type="hidden" name={name} value={rows.filter((row) => !row.reason).map((row) => row.person.email).join(",")} disabled={disabled} /> : null}
    </div>
  );
}
