"use client";

import { Fragment, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconBan, IconCheck, IconPin } from "@rhs-ui/icons";
import {
  WORDS,
  compareAddresses,
  fill,
  type AddressChoice,
  type AddressComparison,
  type AddressConfirmLabels,
  type AddressLine,
  type AddressLineView,
} from "@rhs-ui/commerce/address-confirm-dialog/address";
import { Button } from "@rhs-ui/primitives/button";
import { Callout } from "@rhs-ui/primitives/callout";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export type { AddressChoice, AddressConfirmLabels, AddressLine } from "@rhs-ui/commerce/address-confirm-dialog/address";

export interface AddressConfirmProps {
  /** What the shopper typed, one line per form field, in the order of the form. */
  entered: readonly AddressLine[];
  /** What your address check proposes instead. Lines are matched to the typed ones by `id`. */
  suggested: readonly AddressLine[];
  /** Why the address could not be verified exactly, in a short sentence: "The house number could not be matched". */
  reason: string;
  /** Called with the suggested address when it is chosen and confirmed. Return a promise and the button shows it is working; the dialog closes when it resolves and stays open when it rejects. */
  onUseSuggested?: (address: readonly AddressLine[]) => void | Promise<void>;
  /** Called with the typed address when `allowKeep` is set, it is chosen and confirmed. Same promise behaviour as `onUseSuggested`. */
  onKeepEntered?: (address: readonly AddressLine[]) => void | Promise<void>;
  /** Called when the shopper goes back to the form, with the id of the first line that differs so you can focus that field. In the dialog it is called once the dialog has closed, and the dialog leaves focus alone for you to place. Without it, focus goes back to where it was. */
  onEdit?: (field: string | undefined) => void;
  /** Lets the shopper keep the typed address anyway. It becomes a second choice that warns delivery may fail. Without it the typed address is shown for comparison and cannot be chosen. */
  allowKeep?: boolean;
  /** Always pass your application locale, so the count of differing lines is written the same on the server and in the browser. */
  locale?: string;
  /** Which address is chosen, when you control it. */
  value?: AddressChoice;
  /** Which address is chosen to begin with. Defaults to the suggestion. */
  defaultValue?: AddressChoice;
  /** Called when the choice changes. */
  onValueChange?: (value: AddressChoice) => void;
  /** The words, for another language. */
  labels?: AddressConfirmLabels;
}

export interface AddressConfirmDialogProps extends AddressConfirmProps {
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether the dialog is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes, by a button, Escape or the backdrop. */
  onOpenChange?: (open: boolean) => void;
  /** The element that opens the dialog, usually a Button. Without one, focus goes back to whatever had it when the dialog opened. */
  trigger?: ReactNode;
  /** Extra classes for the dialog content. */
  className?: string;
}

export interface AddressConfirmPanelProps extends AddressConfirmProps, Omit<ComponentProps<"div">, "children" | "title" | "defaultValue" | "onChange"> {
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
}

const titleClass = "text-lg leading-tight font-semibold tracking-[-0.02em] text-balance";

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as PromiseLike<unknown> | undefined)?.then === "function";

/** The sentence under the reason: how many lines differ and how they are marked. */
function hintOf(comparison: AddressComparison, words: typeof WORDS, locale: string): string {
  if (comparison.count === 0) return words.differNone;
  const template = new Intl.PluralRules(locale).select(comparison.count) === "one" ? words.differOne : words.differOther;
  return fill(template, { count: new Intl.NumberFormat(locale).format(comparison.count) });
}

function Header({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-6 flex items-start gap-4", className)}>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 [&_svg]:size-5">
        <IconPin />
      </span>
      <div className="grid min-w-0 gap-1.5">
        {title}
        {children}
      </div>
    </div>
  );
}

function Reason({ reason, hint }: { reason: string; hint: string }) {
  return (
    <>
      <span className="block font-medium text-foreground text-pretty">{reason}</span>
      <span className="block text-pretty">{hint}</span>
    </>
  );
}

/** One line of one address: the words the other address does not have are bold, and a screen reader hears "Changed" before them. */
function AddressLineText({ line, changed, last }: { line: AddressLineView; changed: string; last: boolean }) {
  return (
    <span className="block">
      {line.segments.map((segment, index) => (
        <Fragment key={`${index}-${segment.text}`}>
          {index > 0 ? " " : null}
          {segment.changed ? (
            <strong className="rounded-[3px] bg-foreground/8 px-0.5 font-semibold box-decoration-clone">
              <span className="sr-only">{changed}: </span>
              {segment.text}
            </strong>
          ) : (
            segment.text
          )}
        </Fragment>
      ))}
      {last ? null : <span className="sr-only">, </span>}
    </span>
  );
}

interface AddressCardProps {
  kind: AddressChoice;
  title: string;
  lines: readonly AddressLineView[];
  changed: string;
  /** The card is shown for comparison only and cannot be chosen. */
  locked?: boolean;
  /** Under the lines, for a card that cannot be chosen: why. */
  note?: string;
  id: string;
}

/** One address as a radio card: a heading, the lines, and the radio mark that fills when it is chosen. */
function AddressCard({ kind, title, lines, changed, locked = false, note, id }: AddressCardProps) {
  const titleId = `${id}-${kind}-title`;
  const linesId = `${id}-${kind}-lines`;
  const noteId = `${id}-${kind}-note`;
  return (
    <RadioGroupPrimitive.Item
      value={kind}
      disabled={locked}
      aria-labelledby={titleId}
      aria-describedby={locked && note ? `${linesId} ${noteId}` : linesId}
      className={cn(
        "group/card relative flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left outline-none",
        "transition-[border-color,background-color,box-shadow] duration-150 motion-reduce:transition-none",
        "hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "data-[state=checked]:border-foreground data-[state=checked]:bg-muted/40 data-[state=checked]:shadow-[inset_0_0_0_1px_var(--foreground)]",
        "disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:hover:bg-transparent",
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span id={titleId} className="text-sm font-medium">
          {title}
        </span>
        {locked ? (
          <IconBan aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/70 text-background transition-colors duration-150 group-data-[state=checked]/card:border-foreground group-data-[state=checked]/card:bg-foreground motion-reduce:transition-none [&_svg]:size-3"
          >
            <RadioGroupPrimitive.Indicator>
              <IconCheck />
            </RadioGroupPrimitive.Indicator>
          </span>
        )}
      </span>
      <span id={linesId} className="block text-sm leading-6 text-pretty">
        {lines.map((line, index) => (
          <AddressLineText key={`${line.id}-${index}`} line={line} changed={changed} last={index === lines.length - 1} />
        ))}
      </span>
      {locked && note ? (
        <span id={noteId} className="text-xs leading-snug text-pretty text-muted-foreground">
          {note}
        </span>
      ) : null}
    </RadioGroupPrimitive.Item>
  );
}

interface BodyProps extends AddressConfirmProps {
  header: ReactNode;
  comparison: AddressComparison;
  /** What "Edit address" does. The dialog closes first and hands focus over; the panel calls `onEdit` at once. */
  edit: (field: string | undefined) => void;
  /** Called when a confirmed choice has gone through, so the dialog can close. */
  onDone?: () => void;
}

/** Everything inside the dialog, so the same content also stands on its own in a page. */
function Body({
  header,
  comparison,
  entered,
  suggested,
  allowKeep = false,
  value,
  defaultValue,
  onValueChange,
  onUseSuggested,
  onKeepEntered,
  edit,
  onDone,
  labels,
}: BodyProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState<AddressChoice>(defaultValue ?? "suggested");
  const [busy, setBusy] = useState(false);
  const chosen = value ?? own;
  // Without allowKeep the typed address cannot be chosen, whatever was asked for.
  const choice: AddressChoice = allowKeep ? chosen : "suggested";
  const warn = allowKeep && choice === "entered";

  const change = (next: AddressChoice) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const use = async () => {
    const result = choice === "entered" ? onKeepEntered?.(entered) : onUseSuggested?.(suggested);
    if (isThenable(result)) {
      setBusy(true);
      try {
        await result;
      } catch {
        // The dialog stays open so the shopper can try again; showing the failure is up to the caller.
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    onDone?.();
  };

  return (
    <div data-slot="address-confirm-dialog" className="@container flex min-h-0 flex-1 flex-col">
      {/* The content scrolls when a short screen makes the dialog taller than it; the buttons below it stay in view. */}
      <div className="relative min-h-0 flex-1 overflow-y-auto p-6">
        {header}

        <RadioGroupPrimitive.Root aria-label={words.group} value={choice} onValueChange={(next) => change(next as AddressChoice)} disabled={busy} className="grid gap-3 @md:grid-cols-2">
          <AddressCard kind="suggested" title={words.suggested} lines={comparison.suggested} changed={words.changed} id={id} />
          <AddressCard kind="entered" title={allowKeep ? words.keep : words.entered} lines={comparison.entered} changed={words.changed} locked={!allowKeep} note={words.locked} id={id} />
        </RadioGroupPrimitive.Root>

        {/* The warning opens and closes by growing from nothing, so the buttons below move smoothly instead of jumping. Closed, it is inert: nothing in it can take focus. */}
        <div
          data-open={warn}
          aria-hidden={!warn}
          inert={!warn}
          className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-200 data-[open=true]:grid-rows-[1fr] data-[open=true]:opacity-100 motion-reduce:transition-none"
        >
          {/* `relative` makes the clip a containing block: the callout's screen-reader-only text is positioned, and without this it escapes the clip and stretches the scroller. */}
          <div className="relative min-h-0 overflow-hidden">
            <div className="pt-3">
              <Callout tone="warning" title={words.warningTitle}>
                {words.warning}
              </Callout>
            </div>
          </div>
        </div>
        <p role="status" className="sr-only">
          {warn ? `${words.warningTitle}. ${words.warning}` : ""}
        </p>
      </div>

      {/* The DOM order is the visual order on both layouts, so Tab and a screen reader meet "Edit address" before "Use this address". */}
      <div className="flex flex-col gap-2 border-t border-border bg-[color-mix(in_oklab,var(--background),var(--muted)_60%)] px-6 py-4 @md:flex-row @md:justify-end">
        <Button type="button" variant="outline" disabled={busy} onClick={() => edit(comparison.first)} className="h-11 @md:h-9">
          {words.edit}
        </Button>
        <Button type="button" loading={busy} onClick={() => void use()} className="h-11 @md:h-9">
          {words.use}
        </Button>
      </div>
    </div>
  );
}

/**
 * The dialog for an address that cannot be verified exactly. It sets what the shopper typed beside what your address
 * check suggests, as two radio cards that stack on a phone, with the words that differ in bold (and "Changed" before
 * them for a screen reader) and the suggestion chosen to begin with. "Use this address" confirms the chosen card,
 * "Edit address" goes back to the form and hands you the first line that differs, so you can put focus on that field.
 * With `allowKeep` the typed address becomes a second choice, "Keep what I typed", and choosing it warns that delivery
 * may fail; without it the typed address is shown for comparison and cannot be chosen. A callback may return a promise,
 * and the button shows it is working. Nothing is sent anywhere by the component itself: it only reports the choice.
 */
export function AddressConfirmDialog({ open, defaultOpen = false, onOpenChange, trigger, className, onEdit, locale = "en-US", ...props }: AddressConfirmDialogProps) {
  const words = { ...WORDS, ...props.labels };
  const comparison = useMemo(() => compareAddresses(props.entered, props.suggested), [props.entered, props.suggested]);
  const [inner, setInner] = useState(defaultOpen);
  const shown = open ?? inner;
  // Where focus was when the dialog opened, for a dialog that has no trigger of its own to return to.
  const opener = useRef<HTMLElement | null>(null);
  // Set when "Edit address" closes the dialog, so focus is left for the caller to place.
  const editing = useRef<{ field: string | undefined } | null>(null);

  const setOpen = (next: boolean) => {
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog open={shown} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl", className)}
        onOpenAutoFocus={(event) => {
          opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          // Focus goes to the chosen card without scrolling to it: the entry focus of the radio group scrolls it into view,
          // and on a short screen that opens the dialog already scrolled past its title.
          const card = event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector<HTMLElement>('[role="radio"][data-state="checked"]') : null;
          if (card) {
            event.preventDefault();
            card.focus({ preventScroll: true });
          }
        }}
        onCloseAutoFocus={(event) => {
          const edit = editing.current;
          editing.current = null;
          if (edit && onEdit) {
            // The dialog is gone and nothing has taken focus back: now the caller can send it to the field.
            event.preventDefault();
            onEdit(edit.field);
          } else if (!trigger && opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        <Body
          {...props}
          comparison={comparison}
          header={
            <Header className="pr-8" title={<DialogTitle className={titleClass}>{words.title}</DialogTitle>}>
              <DialogDescription className="grid gap-1 text-sm">
                <Reason reason={props.reason} hint={hintOf(comparison, words, locale)} />
              </DialogDescription>
            </Header>
          }
          edit={(field) => {
            editing.current = { field };
            setOpen(false);
          }}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The same content as the dialog, without the dialog around it: for a checkout step that confirms the address in the
 * page, or for showing the choice in documentation. It takes the same props, and `onEdit` is called at once.
 */
export function AddressConfirmPanel({ headingAs: Heading = "h2", className, onEdit, locale = "en-US", entered, suggested, reason, onUseSuggested, onKeepEntered, allowKeep, value, defaultValue, onValueChange, labels, ...props }: AddressConfirmPanelProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const comparison = useMemo(() => compareAddresses(entered, suggested), [entered, suggested]);
  return (
    <div data-slot="address-confirm-panel" role="group" aria-labelledby={`${id}-title`} className={cn("relative flex flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm", className)} {...props}>
      <Body
        entered={entered}
        suggested={suggested}
        reason={reason}
        onUseSuggested={onUseSuggested}
        onKeepEntered={onKeepEntered}
        allowKeep={allowKeep}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        labels={labels}
        comparison={comparison}
        header={
          <Header
            title={
              <Heading id={`${id}-title`} className={titleClass}>
                {words.title}
              </Heading>
            }
          >
            <p className="grid gap-1 text-sm text-muted-foreground">
              <Reason reason={reason} hint={hintOf(comparison, words, locale)} />
            </p>
          </Header>
        }
        edit={(field) => onEdit?.(field)}
      />
    </div>
  );
}
