"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { IconAlertCircle, IconCheck, IconChevronsUpDown, IconClose, IconInfo, IconPlus } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@rhs-ui/primitives/command";
import { asList, defaultNormalise, findExact, groupOptions, rankOptions, type CreatableOption } from "@rhs-ui/primitives/creatable-select/options";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export type { CreatableOption } from "@rhs-ui/primitives/creatable-select/options";

interface CreatableBase {
  /** The options to choose from: `{ value, label }` and optionally `keywords`, `description`, `group` and `disabled`, like a Combobox. */
  options: readonly CreatableOption[];
  /**
   * Called with the text when someone creates an entry. It may be async. Return the new option to say what
   * it is called and what it is worth (a server answers with an id), or nothing to use the text itself as both.
   * Reject to refuse: the error's message shows under the field and the typed text is kept.
   */
  onCreate?: (input: string) => CreatableOption | void | Promise<CreatableOption | void>;
  /** How two texts are compared to tell whether an entry already exists, so "Design" and "design " are one. Default: capitals and spaces at the ends do not count. */
  normalise?: (text: string) => string;
  /** Names the list for assistive technology, like "Labels". */
  label: string;
  /** What the field says before anything is chosen. */
  placeholder?: string;
  /** What the search box says before anything is typed. */
  searchPlaceholder?: string;
  /** Said when there is nothing to list and nothing typed. */
  emptyText?: string;
  /** The text of the row that creates. Default: Create “design”. */
  createLabel?: (input: string) => string;
  /** The other words of the field: "Add more", the name of a chip's remove button, what is said when something is removed, created or already there, and what a screen reader adds. Every part can be replaced. */
  messages?: Partial<CreatableSelectMessages>;
  /** Submits the choice through hidden inputs, one per value, so FormData and server actions see it. */
  name?: string;
  /** For <Label htmlFor>. */
  id?: string;
  /** Turns the field off and dims it. */
  disabled?: boolean;
  /** Marks the field as required for assistive technology. */
  required?: boolean;
  /** Start with the list open, for a preview or a tour. It never takes the focus until someone has used it. */
  defaultOpen?: boolean;
  /** Where the list opens: under the field and, when there is no room below, above it ("auto", the default); or always "bottom" or "top". */
  placement?: "auto" | "bottom" | "top";
  /** Merged onto the root element. */
  className?: string;
  /** Marks the field invalid, with the destructive border. */
  "aria-invalid"?: boolean;
  /** The id of the line that describes the field: a hint, an error. */
  "aria-describedby"?: string;
}

export interface CreatableSelectSingleProps extends CreatableBase {
  /** One choice, shown in the field. This is the default. */
  multiple?: false;
  /** The chosen value, when you control it. */
  value?: string | null;
  /** The value to start with, when you do not control the field; restored when the surrounding form resets. */
  defaultValue?: string | null;
  /** Called with the chosen value, also when it was just created. */
  onValueChange?: (value: string) => void;
}

export interface CreatableSelectMultipleProps extends CreatableBase {
  /** Several choices, shown as chips in the field. Backspace in the empty search takes the last one back. */
  multiple: true;
  /** The chosen values, when you control them. */
  value?: readonly string[];
  /** The values to start with, when you do not control the field; restored when the surrounding form resets. */
  defaultValue?: readonly string[];
  /** Called with all the chosen values after every change, also when one was just created or a chip was removed. */
  onValueChange?: (value: string[]) => void;
}

export type CreatableSelectProps = CreatableSelectSingleProps | CreatableSelectMultipleProps;

const defaultCreateLabel = (input: string): string => `Create “${input}”`;

/** What the field says besides the entries and what you type. Every part can be replaced, for another language or your own voice. */
export interface CreatableSelectMessages {
  /** What the field says after the first chip, where the placeholder was: "Add more". */
  addMore: string;
  /** The name of a chip's remove button, from the chip's label: "Remove Bug". */
  remove: (label: string) => string;
  /** Said, politely, after a chip was taken back: "Removed Bug". */
  removed: (label: string) => string;
  /** Under the field, and said, when the name typed is already chosen: "Bug is already added.". */
  alreadyAdded: (label: string) => string;
  /** The Create row while `onCreate` runs, from the text that was typed: `Creating “design”...`. */
  creating: (input: string) => string;
  /** Said, politely, after an entry was created and chosen: "Created Billing and chose it". */
  created: (label: string) => string;
  /** Under the field when `onCreate` rejects without a message of its own: `Could not create “design”.`. */
  failed: (input: string) => string;
  /** Read by a screen reader after a row that is chosen: "Bug, selected". */
  selected: string;
  /** What a screen reader reads with the field's name once there are chips, after the words on the button: "Labels: 2 selected". */
  count: (label: string, chosen: number) => string;
  /** The name of the search box, from the name of the list: "Search or create labels". */
  search: (label: string) => string;
}

const MESSAGES: CreatableSelectMessages = {
  addMore: "Add more",
  remove: (label) => `Remove ${label}`,
  removed: (label) => `Removed ${label}`,
  alreadyAdded: (label) => `${label} is already added.`,
  creating: (input) => `Creating “${input}”...`,
  created: (label) => `Created ${label} and chose it`,
  failed: (input) => `Could not create “${input}”.`,
  selected: "selected",
  count: (label, chosen) => `${label}: ${chosen} selected`,
  search: (label) => `Search or create ${label.toLowerCase()}`,
};

/**
 * A searchable select that lets people add what is not in the list: labels, tags, categories, projects.
 * When what was typed matches nothing exactly (capitals and spaces at the ends do not count), a last row
 * reading Create "design" appears. Enter takes the highlighted row, which is the Create row when it is all
 * there is, and Ctrl or Cmd with Enter always creates what was typed (the Create row says so when other rows
 * are listed above it). While `onCreate` runs the row shows a spinner and the list cannot be touched; if it
 * rejects, its message is shown under the field and the typed text stays, so nothing is lost. A name that
 * already exists is never created twice: the existing one is chosen. The new entry is chosen at once. With
 * `multiple` the choices are removable chips (taking one back leaves the focus on the next chip), and
 * Backspace in the empty search takes the last one back. Built on the same panel as the Combobox, so the
 * keyboard, the announcements and the look are the ones a person already knows; the field's own words are
 * in `messages`.
 */
export function CreatableSelect(props: CreatableSelectProps) {
  const {
    options,
    onCreate,
    normalise = defaultNormalise,
    label,
    placeholder = props.multiple ? "Add or create" : "Choose or create",
    searchPlaceholder = "Search or create...",
    emptyText = "Nothing here yet. Type to create the first one.",
    createLabel = defaultCreateLabel,
    messages: overrides,
    name,
    id,
    disabled,
    required,
    defaultOpen = false,
    placement = "auto",
    className,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    multiple,
    value,
    defaultValue,
  } = props;
  const messages: CreatableSelectMessages = { ...MESSAGES, ...overrides };
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [own, setOwn] = useState<readonly string[]>(() => asList(defaultValue));
  const [made, setMade] = useState<readonly CreatableOption[]>([]);
  const [creating, setCreating] = useState(false);
  // The line under the field: a refusal from onCreate (an error), or a word that something is already there (a note).
  const [notice, setNotice] = useState<{ tone: "error" | "note"; text: string } | null>(null);
  const [said, setSaid] = useState("");
  // The key that creates whatever else is listed is Command on a Mac and Control elsewhere; the browser is asked once the field has mounted.
  const [mac, setMac] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const addMore = useRef<HTMLButtonElement>(null);
  // A chip that was removed with its own button takes that button away: the focus is handed on once the chip is gone.
  const handOn = useRef<{ at: number; count: number } | null>(null);
  // A list that starts open is a preview: it must not take the focus from the page, until someone has used it.
  const used = useRef(false);

  const all = useMemo(() => [...options, ...made.filter((entry) => !options.some((option) => option.value === entry.value))], [options, made]);
  const chosen = value !== undefined ? asList(value) : own;
  const byValue = (wanted: string): CreatableOption | undefined => all.find((option) => option.value === wanted);
  const typed = query.trim().replace(/\s+/g, " ");
  const ranked = useMemo(() => rankOptions(all, query, normalise), [all, query, normalise]);
  const showCreate = typed !== "" && !findExact(all, typed, normalise);

  useEffect(() => {
    const form = root.current?.closest("form");
    if (!form || value !== undefined) return;
    const reset = () => {
      setOwn(asList(defaultValue));
      setMade([]);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, value]);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  // What a screen reader was told stays only while it is news.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  function show(next: boolean) {
    used.current = true;
    setOpen(next);
    if (!next) {
      setQuery("");
      setNotice(null);
    }
  }

  function commit(next: string[]) {
    if (value === undefined) setOwn(next);
    if (props.multiple) props.onValueChange?.(next);
    else props.onValueChange?.(next[0] ?? "");
  }

  /**
   * Chooses a row: one choice takes it and closes, several switch it on or off. Typing the name of something
   * that is already chosen and pressing Enter is a refusal, not a removal: the person meant to add it.
   */
  function pick(wanted: string) {
    if (!multiple) {
      commit([wanted]);
      show(false);
      return;
    }
    const entry = byValue(wanted);
    if (entry && chosen.includes(wanted) && typed !== "" && findExact([entry], typed, normalise)) {
      setNotice({ tone: "note", text: messages.alreadyAdded(entry.label) });
      setSaid(messages.alreadyAdded(entry.label));
      return;
    }
    commit(chosen.includes(wanted) ? chosen.filter((existing) => existing !== wanted) : [...chosen, wanted]);
  }

  /** Takes a chip back. From its own button, the focus moves on to the next chip's button, else the one before, else the field, so a keyboard or a screen reader does not lose its place. */
  function remove(wanted: string, fromButton = false) {
    const gone = byValue(wanted);
    handOn.current = fromButton ? { at: chips.findIndex((chip) => chip.value === wanted), count: chips.length } : null;
    commit(chosen.filter((entry) => entry !== wanted));
    if (gone) setSaid(messages.removed(gone.label));
  }

  async function create() {
    if (!typed || creating) return;
    // Refused as a duplicate: what already exists is chosen instead.
    const existing = findExact(all, typed, normalise);
    if (existing) {
      pick(existing.value);
      return;
    }
    setCreating(true);
    setNotice(null);
    try {
      const answer = (await onCreate?.(typed)) ?? { value: typed, label: typed };
      // A server may answer with something that is already in the list: then that one is chosen, and nothing is added twice.
      const again = findExact(all, answer.label, normalise) ?? findExact(all, answer.value, normalise);
      const entry = again ?? answer;
      if (!again) setMade((now) => [...now, entry]);
      setQuery("");
      if (multiple) commit([...chosen.filter((existingValue) => existingValue !== entry.value), entry.value]);
      else {
        commit([entry.value]);
        show(false);
      }
      setSaid(messages.created(entry.label));
    } catch (error) {
      const text = error instanceof Error && error.message ? error.message : messages.failed(typed);
      setNotice({ tone: "error", text });
      setSaid(text);
    } finally {
      setCreating(false);
      field.current?.focus();
    }
  }

  const selected = !multiple && chosen[0] !== undefined ? byValue(chosen[0]) : undefined;
  const chips = multiple ? chosen.map((entry) => byValue(entry)).filter((entry): entry is CreatableOption => Boolean(entry)) : [];

  // Once a chip is gone, the focus that was on its button goes to the next chip's button, else the one before it, else the field itself.
  useEffect(() => {
    const pending = handOn.current;
    if (!pending) return;
    handOn.current = null;
    if (chips.length >= pending.count) return;
    const buttons = root.current?.querySelectorAll<HTMLButtonElement>("[data-slot=creatable-select-remove]");
    (buttons?.[Math.min(pending.at, (buttons?.length ?? 0) - 1)] ?? addMore.current)?.focus();
  });

  /** The words the field shows when it has chips: they open the accessible name too, so what is seen is what a voice command can say. */
  const addText = chips.length ? messages.addMore : placeholder;

  const trigger = multiple ? (
    <div
      aria-disabled={disabled || undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget && !disabled) show(!open);
      }}
      className={cn(
        fieldSurface,
        "relative flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 py-1 pr-8 pl-1.5",
        "has-[[data-slot=creatable-select-trigger]:focus-visible]:border-ring has-[[data-slot=creatable-select-trigger]:focus-visible]:ring-[3px] has-[[data-slot=creatable-select-trigger]:focus-visible]:ring-ring/40",
        // The border is this box's, so the invalid look of the field surface, which only reaches the element that holds aria-invalid, is given here to the box that holds the trigger.
        "has-[[data-slot=creatable-select-trigger][aria-invalid=true]]:border-destructive has-[[data-slot=creatable-select-trigger][aria-invalid=true]]:ring-destructive/25 has-[[data-slot=creatable-select-trigger][aria-invalid=true]:focus-visible]:ring-destructive/30",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {chips.map((chip) => (
        <Badge key={chip.value} variant="secondary" className="h-6 gap-1 py-0 pr-1 pl-2.5 text-[0.8125rem] font-normal">
          {chip.label}
          <button
            type="button"
            data-slot="creatable-select-remove"
            disabled={disabled}
            aria-label={messages.remove(chip.label)}
            onClick={() => remove(chip.value, true)}
            className="grid size-4 place-items-center rounded-full text-muted-foreground outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:size-3"
          >
            <IconClose />
          </button>
        </Badge>
      ))}
      <PopoverTrigger
        ref={addMore}
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={required || undefined}
        aria-label={`${addText}, ${messages.count(label, chips.length)}`}
        data-slot="creatable-select-trigger"
        className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-left text-sm text-muted-foreground outline-none disabled:cursor-not-allowed"
      >
        {addText}
      </PopoverTrigger>
      <IconChevronsUpDown size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
    </div>
  ) : (
    <PopoverTrigger
      id={id}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      aria-required={required || undefined}
      data-slot="creatable-select-trigger"
      data-placeholder={selected ? undefined : ""}
      className={cn(fieldSurface, "flex h-9 w-full min-w-0 items-center justify-between gap-2 px-3 text-left whitespace-nowrap data-[placeholder]:text-muted-foreground")}
    >
      <span className="truncate">{selected?.label ?? placeholder}</span>
      <IconChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />
    </PopoverTrigger>
  );

  const row = (option: CreatableOption) => {
    const on = chosen.includes(option.value);
    return (
      <CommandItem
        key={option.value}
        value={option.value}
        disabled={option.disabled}
        data-checked={on || undefined}
        onSelect={() => pick(option.value)}
        className={multiple ? "gap-2.5" : "pr-8"}
      >
        {multiple ? (
          <span
            aria-hidden="true"
            className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border [&_svg]:size-3", on ? "border-foreground bg-foreground text-background" : "border-muted-foreground/70")}
          >
            {on ? <IconCheck /> : null}
          </span>
        ) : null}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-foreground">{option.label}</span>
          {option.description ? <span className="text-xs text-muted-foreground">{option.description}</span> : null}
        </span>
        {on ? (
          <>
            {multiple ? null : <IconCheck size={14} className="absolute right-2" />}
            <span className="sr-only">{`, ${messages.selected}`}</span>
          </>
        ) : null}
      </CommandItem>
    );
  };

  return (
    <div ref={root} data-slot="creatable-select" className={cn("w-full min-w-0", className)}>
      <Popover open={open && !disabled} onOpenChange={show}>
        {/* The list is anchored to the field together with the line under it, so a message about a failed create is never covered. */}
        <PopoverAnchor asChild>
          <div className="grid min-w-0 gap-1.5">
            {trigger}
            <p role="status" className={cn("flex items-start gap-1.5 text-xs leading-5 empty:hidden", notice?.tone === "error" ? "font-medium text-destructive" : "text-muted-foreground")}>
              {notice ? (
                <>
                  {notice.tone === "error" ? <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> : <IconInfo aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />}
                  <span>{notice.text}</span>
                </>
              ) : null}
            </p>
          </div>
        </PopoverAnchor>
        {name ? chosen.map((entry) => <input key={entry} type="hidden" name={name} value={entry} disabled={disabled} />) : null}
        <PopoverContent
          align="start"
          side={placement === "top" ? "top" : "bottom"}
          avoidCollisions={placement === "auto"}
          aria-label={label}
          className="w-(--radix-popover-trigger-width) min-w-64 overflow-hidden p-0"
          onOpenAutoFocus={(event) => {
            if (!used.current) event.preventDefault();
          }}
        >
          <Command shouldFilter={false} loop className="rounded-none bg-transparent">
            <CommandInput
              ref={field}
              value={query}
              onValueChange={(next) => {
                setQuery(next);
                setNotice(null);
              }}
              readOnly={creating}
              placeholder={searchPlaceholder}
              aria-label={messages.search(label)}
              onKeyDown={(event) => {
                if (multiple && event.key === "Backspace" && query === "" && chosen.length > 0) {
                  event.preventDefault();
                  const last = chosen[chosen.length - 1];
                  if (last !== undefined) remove(last);
                } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && showCreate && !event.nativeEvent.isComposing) {
                  // Enter takes the highlighted row, which is the best match; with Ctrl or Cmd it creates what was typed, whatever else is listed.
                  event.preventDefault();
                  void create();
                }
              }}
            />
            {/* While an entry is being created nothing in the list can be touched. */}
            {/* The message sits beside the list and not inside it, so the list stays a clean listbox for assistive technology. */}
            {ranked.length === 0 && !showCreate ? (
              <p role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            ) : null}
            <CommandList inert={creating} className={cn("max-h-72 transition-opacity duration-150 motion-reduce:transition-none", creating && "opacity-70", ranked.length === 0 && !showCreate && "hidden")}>
              {groupOptions(ranked).map((group) => (
                <CommandGroup key={group.name || "options"} heading={group.name || undefined}>
                  {group.options.map(row)}
                </CommandGroup>
              ))}
              {showCreate ? (
                <>
                  {ranked.length ? <div role="presentation" className="-mx-1.5 my-1 h-px bg-border" /> : null}
                  <CommandItem value="__create__" onSelect={() => void create()} aria-keyshortcuts={ranked.length ? "Control+Enter Meta+Enter" : undefined} className="gap-2.5">
                    {creating ? <Spinner size={16} label="" aria-hidden="true" /> : <IconPlus size={16} />}
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{creating ? messages.creating(typed) : createLabel(typed)}</span>
                    {/* With other rows above, Enter takes the highlighted one: this says how to create anyway. A touch screen has no such key. */}
                    {ranked.length && !creating ? (
                      <CommandShortcut aria-hidden="true" className="shrink-0 pointer-coarse:hidden">
                        {mac ? "⌘ Enter" : "Ctrl Enter"}
                      </CommandShortcut>
                    ) : null}
                  </CommandItem>
                </>
              ) : null}
            </CommandList>
            <span role="status" className="sr-only">
              {said}
            </span>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
