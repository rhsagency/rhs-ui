"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconArrowUpRight, IconFile, IconGlobe, IconHash, IconLink, IconMail, IconPhone } from "@rhs-ui/icons";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Input } from "@rhs-ui/primitives/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Label } from "@rhs-ui/primitives/label";
import { trackPress, whenReleased } from "@rhs-ui/primitives/link-field/blur-guard";
import { ALL_KINDS, analyseLink, canOpenInNewTab, DEFAULT_LABELS, examplesFor, type LinkAnalysis, type LinkKind, type LinkLabels, type LinkValue } from "@rhs-ui/primitives/link-field/links";
import { cn } from "@/lib/utils";

export type { LinkKind, LinkLabels, LinkValue } from "@rhs-ui/primitives/link-field/links";

export interface LinkFieldProps extends Omit<ComponentProps<"fieldset">, "defaultValue" | "onChange" | "children" | "name"> {
  /** The link, when you control it. */
  value?: LinkValue;
  /** The link to start with, when you do not control it. */
  defaultValue?: LinkValue;
  /** Called on every change with the link as it will be stored (a bare domain with https:// in front, `rel` set for an external link that opens in a new tab) and whether it can be used. A destination that is refused, or not a link yet, is reported with an empty `href`, so it can never be stored by accident. */
  onValueChange?: (value: LinkValue, state: { valid: boolean }) => void;
  /** The kinds of destination that are accepted. Default: all five. */
  allow?: readonly LinkKind[];
  /** Refuse a link with no text. Default false. */
  requireText?: boolean;
  /** The name of the group, shown as its legend. Default "Link". */
  label?: string;
  /** Keep `label` for assistive technology only. */
  hideLabel?: boolean;
  /** The field's name for a plain form submit: hidden inputs `<name>-text`, `<name>-href`, `<name>-new-tab` ("true" or "false") and `<name>-rel`. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<LinkLabels>;
}

interface Draft {
  text: string;
  destination: string;
  newTab: boolean;
}

const KIND_ICONS = { external: IconGlobe, relative: IconFile, anchor: IconHash, email: IconMail, phone: IconPhone } as const;

/** A destination as the link is stored, and the words for what is wrong with it. */
function reasonText(found: LinkAnalysis, labels: LinkLabels): string | null {
  if (found.state !== "bad") return null;
  if (found.reason === "notAllowed") return labels.notAllowed(labels.kindNames[found.kind ?? "external"]);
  if (found.reason === "path") return labels.badPath;
  return found.reason === "unsupported" ? labels.unsupported : labels.notALink;
}

/**
 * A link the way a CMS stores it: the text to show, where it goes, and whether
 * it opens in a new tab, in one group. The destination takes a web address, a
 * path on the site ("/pricing"), an anchor ("#faq"), an email or a phone number,
 * says in words which of them it recognised, puts https:// in front of a bare
 * domain and mailto: or tel: in front of a bare address or number, and refuses
 * what could harm a visitor (javascript:, data:, file:). An external link set to
 * open in a new tab is reported with `rel` "noopener noreferrer", so the page
 * it opens cannot reach back into yours. A live preview draws the link as the
 * button visitors will see, with a small arrow when it leaves the site.
 */
export function LinkField({
  value,
  defaultValue,
  onValueChange,
  allow = ALL_KINDS,
  requireText = false,
  label = "Link",
  hideLabel = false,
  name,
  labels: labelOverrides,
  disabled,
  className,
  ...props
}: LinkFieldProps) {
  const id = useId();
  const textId = `${id}-text`;
  const destinationId = `${id}-destination`;
  const newTabId = `${id}-new-tab`;
  const helpId = `${id}-help`;
  const textErrorId = `${id}-text-error`;
  const labels: LinkLabels = { ...DEFAULT_LABELS, ...labelOverrides, kind: { ...DEFAULT_LABELS.kind, ...labelOverrides?.kind }, kindNames: { ...DEFAULT_LABELS.kindNames, ...labelOverrides?.kindNames } };
  const start = value ?? defaultValue;
  const [draft, setDraft] = useState<Draft>({ text: start?.text ?? "", destination: start?.href ?? "", newTab: start?.newTab ?? false });
  const [synced, setSynced] = useState(value);
  const [destinationProblem, setDestinationProblem] = useState<string | null>(null);
  const [textProblem, setTextProblem] = useState<string | null>(null);

  const found = analyseLink(draft.destination, allow);
  const kind = found.state === "ok" ? found.kind : null;
  const mayOpenNew = kind === null || canOpenInNewTab(kind);
  const openNew = draft.newTab && mayOpenNew;

  /** The link as it is stored and reported, and whether it can be used. A destination the field does not accept is never reported or submitted: its href is empty. */
  function build(of: Draft): { link: LinkValue; valid: boolean } {
    const result = analyseLink(of.destination, allow);
    const ok = result.state === "ok";
    const newTab = of.newTab && (!ok || canOpenInNewTab(result.kind));
    const rel = ok && result.kind === "external" && newTab ? "noopener noreferrer" : undefined;
    return { link: { text: of.text.trim(), href: ok ? result.href : "", newTab, ...(rel ? { rel } : {}) }, valid: ok && (!requireText || of.text.trim() !== "") };
  }

  // A link that arrives from outside replaces what is typed, unless it is only the clean form of it.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    const now = build(draft).link;
    if (value.text !== now.text || value.href !== now.href || value.newTab !== now.newTab) setDraft({ text: value.text, destination: value.href, newTab: value.newTab });
  }

  useEffect(trackPress, []);

  function change(next: Draft) {
    setDraft(next);
    const { link, valid } = build(next);
    onValueChange?.(link, { valid });
    // A message that is already showing follows the typing and goes as soon as it is right. A new one waits for the field to be left.
    setDestinationProblem((now) => (now === null ? null : reasonText(analyseLink(next.destination, allow), labels)));
    setTextProblem((now) => (now === null ? null : requireText && next.text.trim() === "" ? labels.needsText : null));
  }

  function leaveDestination() {
    const result = analyseLink(draft.destination, allow);
    if (result.state === "ok" && result.href !== draft.destination.trim()) {
      // What is typed becomes what is stored. A value that was typed is already reported in this form; one that came from outside is reported now.
      const next = { ...draft, destination: result.href };
      setDraft(next);
      const { link, valid } = build(next);
      if (value === undefined || value.href !== link.href) onValueChange?.(link, { valid });
    }
    const problem = reasonText(result, labels);
    whenReleased(() => setDestinationProblem(problem));
  }

  function leaveText() {
    const problem = requireText && draft.text.trim() === "" ? labels.needsText : null;
    if (draft.text !== draft.text.trim()) setDraft((now) => ({ ...now, text: now.text.trim() }));
    whenReleased(() => setTextProblem(problem));
  }

  const KindIcon = destinationProblem ? IconAlertCircle : kind ? KIND_ICONS[kind] : IconLink;
  const shownText = draft.text.trim();
  const ready = found.state === "ok" && shownText !== "";
  const { link } = build(draft);

  return (
    <fieldset data-slot="link-field" disabled={disabled} className={cn("m-0 grid min-w-0 grid-cols-1 gap-4 border-0 p-0", className)} {...props}>
      <legend className={cn("mb-4 p-0 text-base font-semibold tracking-[-0.02em]", hideLabel && "sr-only")}>{label}</legend>
      {/* grid-cols-1 is minmax(0, 1fr): without it the column is as wide as its widest line, and a long preview or address pushes the card open. */}
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor={textId}>{labels.text}</Label>
        <Input
          id={textId}
          value={draft.text}
          placeholder={labels.textPlaceholder}
          autoComplete="off"
          aria-required={requireText || undefined}
          aria-invalid={textProblem ? true : undefined}
          aria-describedby={textProblem ? textErrorId : undefined}
          onChange={(event) => change({ ...draft, text: event.target.value })}
          onBlur={leaveText}
        />
        <p id={textErrorId} role="status" className="flex items-start gap-1.5 text-xs text-destructive empty:hidden">
          {textProblem ? (
            <>
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {textProblem}
            </>
          ) : null}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor={destinationId}>{labels.destination}</Label>
        <InputGroup>
          <InputGroupAddon aria-hidden="true" className={cn("pr-0 transition-colors duration-150", destinationProblem && "text-destructive", kind && !destinationProblem && "text-foreground")}>
            <KindIcon />
          </InputGroupAddon>
          <InputGroupInput
            id={destinationId}
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={labels.destinationPlaceholder}
            value={draft.destination}
            aria-invalid={destinationProblem ? true : undefined}
            aria-describedby={helpId}
            onChange={(event) => change({ ...draft, destination: event.target.value })}
            onBlur={leaveDestination}
            className="pl-2"
          />
        </InputGroup>
        <div id={helpId} aria-live="polite" className="min-h-5 text-xs [overflow-wrap:anywhere]">
          {destinationProblem ? (
            <p className="flex items-start gap-1.5 text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {destinationProblem}
            </p>
          ) : found.state === "ok" ? (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{labels.kind[found.kind](found.detail)}</span>
              {found.added && found.kind === "external" ? ` ${labels.addedHttps}` : ""}
            </p>
          ) : (
            <p className="text-muted-foreground">{labels.hint(examplesFor(allow))}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1">
        <div className="flex items-center gap-2.5">
          <Checkbox id={newTabId} checked={openNew} disabled={!mayOpenNew} onCheckedChange={(checked) => change({ ...draft, newTab: checked === true })} />
          <Label htmlFor={newTabId} className={cn("font-normal", !mayOpenNew && "text-muted-foreground")}>
            {labels.newTab}
          </Label>
        </div>
        {!mayOpenNew ? <p className="pl-[1.625rem] text-xs text-muted-foreground">{labels.newTabUnavailable}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-2.5 rounded-lg border border-dashed border-border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground">{labels.preview}</p>
        <span
          aria-hidden="true"
          data-state={ready ? "ready" : "incomplete"}
          className={cn(
            "inline-flex h-9 w-fit max-w-full min-w-0 items-center gap-1.5 rounded-md px-4 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none",
            ready ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            disabled && "opacity-50",
          )}
        >
          <span className="truncate">{shownText || labels.previewEmpty}</span>
          {found.state === "ok" && found.kind === "external" && openNew ? <IconArrowUpRight className="size-4 shrink-0" /> : null}
        </span>
      </div>
      {name ? (
        <>
          <input type="hidden" name={`${name}-text`} value={link.text} disabled={disabled} />
          <input type="hidden" name={`${name}-href`} value={link.href} disabled={disabled} />
          <input type="hidden" name={`${name}-new-tab`} value={String(link.newTab)} disabled={disabled} />
          <input type="hidden" name={`${name}-rel`} value={link.rel ?? ""} disabled={disabled} />
        </>
      ) : null}
    </fieldset>
  );
}
