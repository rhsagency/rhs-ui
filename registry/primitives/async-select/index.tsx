"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconChevronsUpDown, IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export interface AsyncSelectOption {
  /** What the field reports and submits. Unique among the results of one search. */
  value: string;
  /** What the row and the field say. */
  label: string;
  /** A second line under the label: an email address, a company, an id. */
  description?: ReactNode;
  /** Results with the same group are listed under that heading, in order of first appearance. */
  group?: string;
  disabled?: boolean;
}

/** What the list says in each of its states. Every part can be replaced, for another language or your own voice. */
export interface AsyncSelectMessages {
  /** Before the text is long enough to search. */
  idle: (minChars: number) => string;
  /** While the first answer is on its way. */
  loading: string;
  /** When the search found nothing; it should repeat the text, and the repeated text is set in a heavier weight. */
  empty: (query: string) => string;
  /** When the loader failed. */
  error: string;
  /** The button that tries again. */
  retry: string;
}

export interface AsyncSelectProps {
  /** Asks your server. Called with the text (trimmed) and an AbortSignal that is aborted as soon as the next search begins, so pass it to `fetch`. Resolve with the options; reject to show the error line. */
  loadOptions: (query: string, signal: AbortSignal) => Promise<readonly AsyncSelectOption[]>;
  /** The chosen option, when you control it, as the option itself, so the field shows it before anything has loaded. `null` for none. */
  value?: AsyncSelectOption | null;
  /** The option to start with, when you do not control the field; restored when the surrounding form resets. */
  defaultValue?: AsyncSelectOption | null;
  /** Called with the chosen option, or `null` when it is cleared. */
  onValueChange?: (option: AsyncSelectOption | null) => void;
  /** How long to wait after the last keystroke before asking. Default 250 ms. */
  debounce?: number;
  /** How many characters to type before the first question. Default 1. With 0 the list asks as soon as it opens. */
  minChars?: number;
  /** What to list before anything is typed: options (shown at once, without a question), or `true` to ask the loader with an empty text. Default false: the list asks to type. */
  defaultOptions?: readonly AsyncSelectOption[] | boolean;
  /** Show a small button that clears the choice. Default false. */
  clearable?: boolean;
  /** What the list says in each state. */
  messages?: Partial<AsyncSelectMessages>;
  /** Names the list for assistive technology, like "Customer". */
  label: string;
  /** What the field says before an option is chosen. */
  placeholder?: string;
  /** What the search box says before anything is typed. */
  searchPlaceholder?: string;
  /** Submits the value through a hidden input, so FormData and server actions see it. */
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

const MESSAGES: AsyncSelectMessages = {
  idle: (minChars) => (minChars <= 1 ? "Start typing to search." : `Type at least ${minChars} characters to search.`),
  loading: "Searching...",
  empty: (query) => `No results for ${query}`,
  error: "Could not load the results.",
  retry: "Retry",
};

/** A request that has not answered in this long is shown as a loading row; a quicker one just swaps the list, with no flash. */
const SLOW_MS = 150;

type Phase = "idle" | "loading" | "ready" | "error";

interface Answer {
  phase: Phase;
  options: readonly AsyncSelectOption[];
  /** The text the options answer. */
  query: string;
}

/** Where a list begins: with the options you gave, asking the loader at once, or waiting for text. */
function firstAnswer(defaultOptions: AsyncSelectProps["defaultOptions"], minChars: number): Answer {
  if (Array.isArray(defaultOptions)) return { phase: "ready", options: defaultOptions, query: "" };
  return { phase: defaultOptions === true || minChars === 0 ? "loading" : "idle", options: [], query: "" };
}

/** The text with the part that repeats the query set heavier, wherever the message puts it. */
function Emphasised({ text, query }: { text: string; query: string }) {
  const at = query ? text.indexOf(query) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="font-medium break-all text-foreground">{query}</span>
      {text.slice(at + query.length)}
    </>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <div className="flex min-h-32 flex-col items-center justify-center gap-2.5 px-4 py-6 text-center text-sm text-muted-foreground">{children}</div>;
}

interface PanelProps {
  loadOptions: AsyncSelectProps["loadOptions"];
  debounce: number;
  minChars: number;
  defaultOptions: AsyncSelectProps["defaultOptions"];
  selected: AsyncSelectOption | null;
  messages: AsyncSelectMessages;
  label: string;
  searchPlaceholder: string;
  onPick: (option: AsyncSelectOption) => void;
}

/**
 * The open list. It lives only while the list is open, so closing it drops the text, forgets the answers and
 * aborts what is on its way, and reopening starts clean.
 */
function Panel({ loadOptions, debounce, minChars, defaultOptions, selected, messages, label, searchPlaceholder, onPick }: PanelProps) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<Answer>(() => firstAnswer(defaultOptions, minChars));
  const [slow, setSlow] = useState(false);
  const [said, setSaid] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const loader = useRef(loadOptions);
  const running = useRef<AbortController | null>(null);
  const ticket = useRef(0);
  const clock = useRef<number | undefined>(undefined);

  useEffect(() => {
    loader.current = loadOptions;
  });
  useEffect(
    () => () => {
      running.current?.abort();
      window.clearTimeout(clock.current);
    },
    [],
  );

  function settle(next: Answer) {
    window.clearTimeout(clock.current);
    setSlow(false);
    setAnswer(next);
  }

  /** Asks for a text. Whatever was on its way is aborted, and if it answers anyway its answer is dropped: only the latest question can fill the list. */
  function ask(text: string) {
    running.current?.abort();
    const controller = new AbortController();
    running.current = controller;
    ticket.current += 1;
    const mine = ticket.current;
    setAnswer((now) => ({ ...now, phase: "loading", query: text }));
    setSlow(false);
    window.clearTimeout(clock.current);
    clock.current = window.setTimeout(() => setSlow(true), SLOW_MS);
    Promise.resolve()
      .then(() => loader.current(text, controller.signal))
      .then(
        (options) => {
          if (mine === ticket.current) settle({ phase: "ready", options, query: text });
        },
        () => {
          if (mine === ticket.current && !controller.signal.aborted) settle({ phase: "error", options: [], query: text });
        },
      );
  }

  useEffect(() => {
    const text = query.trim();
    const fromStart = text === "";
    if (fromStart && Array.isArray(defaultOptions)) {
      ticket.current += 1;
      running.current?.abort();
      settle({ phase: "ready", options: defaultOptions, query: "" });
      return;
    }
    if (text.length < minChars && !(fromStart && defaultOptions === true)) {
      // Too short to ask: forget whatever is on its way, and say what is needed.
      ticket.current += 1;
      running.current?.abort();
      settle({ phase: "idle", options: [], query: text });
      return;
    }
    const timer = window.setTimeout(() => ask(text), fromStart ? 0 : debounce);
    return () => window.clearTimeout(timer);
    // The loader and the messages are read from a ref and from props at the time of asking; only a new text starts a new question.
  }, [query]);

  const loading = answer.phase === "loading";
  const loadingRow = loading && (slow || answer.options.length === 0);

  // What a screen reader is told, once per answer.
  useEffect(() => {
    if (answer.phase === "ready") setSaid(answer.options.length ? `${answer.options.length} ${answer.options.length === 1 ? "result" : "results"}` : messages.empty(answer.query));
    else if (answer.phase === "loading") setSaid(messages.loading);
    else if (answer.phase === "error") setSaid(messages.error);
    else setSaid("");
    // Only a change of phase or of result is news.
  }, [answer.phase, answer.options.length, answer.query]);

  const groups = new Map<string, AsyncSelectOption[]>();
  for (const option of answer.options) groups.set(option.group ?? "", [...(groups.get(option.group ?? "") ?? []), option]);

  // A message is not an option: it sits beside the list, never inside it, so the list stays a clean listbox for assistive technology (and is hidden while a message is up).
  let notice: ReactNode = null;
  let items: ReactNode = null;
  if (answer.phase === "error") {
    notice = (
      <Notice>
        <span className="flex items-center gap-2 text-foreground">
          <IconAlertCircle aria-hidden="true" className="size-4 shrink-0 text-destructive" />
          {messages.error}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            ask(query.trim());
            // The button goes away with the error; the focus goes back to the text, where the arrow keys and Enter work.
            field.current?.focus();
          }}
        >
          {messages.retry}
        </Button>
      </Notice>
    );
  } else if (loadingRow) {
    notice = (
      <Notice>
        <span className="flex items-center gap-2">
          <Spinner size={16} label="" aria-hidden="true" />
          {messages.loading}
        </span>
      </Notice>
    );
  } else if (answer.phase === "idle") {
    notice = <Notice>{messages.idle(minChars)}</Notice>;
  } else if (answer.options.length === 0) {
    notice = (
      <Notice>
        <span className="[overflow-wrap:anywhere]">
          <Emphasised text={messages.empty(answer.query)} query={answer.query} />
        </span>
      </Notice>
    );
  } else {
    items = [...groups].map(([group, options]) => (
      <CommandGroup key={group || "results"} heading={group || undefined} className={cn("transition-opacity duration-150 motion-reduce:transition-none", loading && "opacity-60")}>
        {options.map((option) => {
          const chosen = option.value === selected?.value;
          return (
            <CommandItem key={option.value} value={option.value} disabled={option.disabled} data-checked={chosen || undefined} onSelect={() => onPick(option)} className="pr-8">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-foreground">{option.label}</span>
                {option.description ? <span className="truncate text-xs text-muted-foreground">{option.description}</span> : null}
              </span>
              {chosen ? (
                <>
                  <IconCheck size={14} className="absolute right-2" />
                  <span className="sr-only">, selected</span>
                </>
              ) : null}
            </CommandItem>
          );
        })}
      </CommandGroup>
    ));
  }

  return (
    <Command shouldFilter={false} loop className="rounded-none bg-transparent">
      <div className="relative">
        <CommandInput ref={field} value={query} onValueChange={setQuery} placeholder={searchPlaceholder} aria-label={`Search ${label.toLowerCase()}`} aria-busy={loading || undefined} />
        {/* The spinner sits over the end of the input, so the input does not move when it appears. */}
        {loading ? <Spinner size={16} label="" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground" /> : null}
      </div>
      {/* The list and a message share one minimum height, so the loading row, the empty line and the error line sit where the results will, and nothing below the input jumps. */}
      {notice}
      <CommandList aria-busy={loading || undefined} className={cn("max-h-72 min-h-32", notice && "hidden")}>
        {items}
      </CommandList>
      <span role="status" className="sr-only">
        {said}
      </span>
    </Command>
  );
}

/**
 * A select whose options come from your server: for customers, products or records that are too many to ship
 * to the browser. Typing asks `loadOptions` after a pause; each new question aborts the one before it
 * through its AbortSignal, and an answer that arrives late is dropped, so an old answer can never replace a
 * new one. While it waits the input shows a small spinner and, if the answer is slow, the list a loading row
 * (a quick answer just swaps the list); an empty answer says "No results for acme", and a failure says so
 * with a Retry button. The list keeps one minimum height, so none of these states moves anything under the
 * input. The chosen option is passed as an object, so the field names it before anything has loaded. Arrow
 * keys, Enter and Escape follow the combobox pattern, with the highlight named by aria-activedescendant,
 * and every answer is announced politely.
 */
export function AsyncSelect({
  loadOptions,
  value,
  defaultValue = null,
  onValueChange,
  debounce = 250,
  minChars = 1,
  defaultOptions = false,
  clearable = false,
  messages: overrides,
  label,
  placeholder = "Search to choose",
  searchPlaceholder = "Search...",
  name,
  id,
  disabled,
  required,
  defaultOpen = false,
  placement = "auto",
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: AsyncSelectProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [uncontrolled, setUncontrolled] = useState<AsyncSelectOption | null>(defaultValue);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  // A list that starts open is a preview: it must not take the focus from the page, until someone has used it.
  const used = useRef(false);
  const selected = value !== undefined ? value : uncontrolled;
  const messages: AsyncSelectMessages = { ...MESSAGES, ...overrides };

  useEffect(() => {
    const form = root.current?.closest("form");
    if (!form || value !== undefined) return;
    const reset = () => setUncontrolled(defaultValue);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, value]);

  function show(next: boolean) {
    used.current = true;
    setOpen(next);
  }

  function choose(option: AsyncSelectOption | null) {
    if (value === undefined) setUncontrolled(option);
    onValueChange?.(option);
  }

  return (
    <div ref={root} data-slot="async-select" className={cn("relative w-full", className)}>
      <Popover open={open && !disabled} onOpenChange={show}>
        <PopoverTrigger
          ref={trigger}
          id={id}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-required={required || undefined}
          data-slot="async-select-trigger"
          data-placeholder={selected ? undefined : ""}
          className={cn(
            fieldSurface,
            "flex h-9 w-full min-w-0 items-center justify-between gap-2 px-3 text-left whitespace-nowrap data-[placeholder]:text-muted-foreground",
          )}
        >
          {/* With a clear button over the end of the field, the text gives way to it before the chevron. */}
          <span className={cn("truncate", clearable && selected && "pr-7")}>{selected?.label ?? placeholder}</span>
          <IconChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        {clearable && selected && !disabled ? (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              choose(null);
              // The button goes away with the choice: the focus goes to the field, so a keyboard or a screen reader keeps its place in the form.
              trigger.current?.focus();
            }}
            className="absolute top-1/2 right-8 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <IconClose size={14} />
          </button>
        ) : null}
        {name ? <input type="hidden" name={name} value={selected?.value ?? ""} /> : null}
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
          <Panel
            loadOptions={loadOptions}
            debounce={debounce}
            minChars={minChars}
            defaultOptions={defaultOptions}
            selected={selected}
            messages={messages}
            label={label}
            searchPlaceholder={searchPlaceholder}
            onPick={(option) => {
              choose(option);
              show(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
