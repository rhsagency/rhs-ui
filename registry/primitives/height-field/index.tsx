"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ClipboardEvent, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconAlertCircle, IconInfo } from "@rhs-ui/icons";
import { trackPress, whenReleased } from "@rhs-ui/primitives/height-field/blur-guard";
import {
  centimetresOf,
  defaultUnitFor,
  DEFAULT_LABELS,
  feetAndInches,
  inchesOf,
  parseCentimetres,
  parseFeetInches,
  tidyCentimetres,
  tidyWhole,
  writeCentimetres,
  writeFeetInches,
  type HeightLabels,
  type HeightUnit,
} from "@rhs-ui/primitives/height-field/heights";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

export type { HeightLabels, HeightUnit } from "@rhs-ui/primitives/height-field/heights";

export interface HeightFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "id"> {
  /** The height in centimetres, when you control it. Null while the field is empty. */
  value?: number | null;
  /** The height to start with, in centimetres, when you do not control it. */
  defaultValue?: number | null;
  /**
   * Called with the height as whole centimetres whatever unit was typed in, or null while the field is empty,
   * and with `valid` true when it is inside `min` and `max`. A height that is out of range is still reported, so a form can say why.
   */
  onValueChange?: (centimetres: number | null, state: { valid: boolean }) => void;
  /** The unit shown, when you control it: "cm", or "ftin" for feet and inches. */
  unit?: HeightUnit;
  /** The unit to start with, when you do not control it. Default: guessed from `locale`, feet and inches for the United States and the United Kingdom, else centimetres. */
  defaultUnit?: HeightUnit;
  /** Called when the person switches unit. */
  onUnitChange?: (unit: HeightUnit) => void;
  /** The lowest height allowed, in centimetres. Default 50. */
  min?: number;
  /** The highest height allowed, in centimetres. Default 250. */
  max?: number;
  /** The locale that writes the numbers, and guesses the unit. Default "en-US". */
  locale?: string;
  /** The field's name for a plain form submit: the height as whole centimetres in a hidden input. */
  name?: string;
  /** Turn the whole field off. */
  disabled?: boolean;
  /** Put on the first input, so a <label htmlFor> focuses the field. The input keeps its own name (Feet, or Height in centimetres), so give the label an id and pass it as `aria-labelledby` to name the whole group by the visible label. */
  id?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<HeightLabels>;
}

interface Drafts {
  cm: string;
  feet: string;
  inches: string;
}

const draftsFor = (cm: number | null): Drafts => {
  if (cm === null) return { cm: "", feet: "", inches: "" };
  const { feet, inches } = feetAndInches(inchesOf(cm));
  return { cm: String(cm), feet: String(feet), inches: String(inches) };
};

/** The centimetres the two feet and inches fields make, or null when both are empty. */
const fromFeetInches = (drafts: Drafts): number | null => (drafts.feet === "" && drafts.inches === "" ? null : centimetresOf(Number(drafts.feet || 0), Number(drafts.inches || 0)));

// Where the browser can size a field to its text, the unit sits right behind the number; elsewhere the box has a width of its own.
const NUMBER = "h-full min-w-[1ch] flex-none bg-transparent px-0 text-right tabular-nums supports-[field-sizing:content]:w-auto supports-[field-sizing:content]:field-sizing-content";
/** Where an empty field starts when an arrow key is pressed: 170 cm, 5 ft 7 in. */
const START = 170;
// The group's own focus border would win over the red one while the cursor is still in a field that is wrong, so the red is asked for in the focused state too.
const WRONG = "border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/30";

/**
 * A person's height, in the unit they think in. A switch between cm and ft / in
 * changes the field: centimetres are one number, feet and inches are two small
 * ones, and the other way of writing the same height sits quietly beside them
 * ("5 ft 11 in"). Whatever is typed, the field reports whole centimetres, so a
 * form stores one thing. Switching converts what is there, to the nearest inch
 * or centimetre, without changing the stored height until someone edits it.
 * Inches above 11 roll into feet when the field is left, 1.8 and 1,80 are read
 * as metres, an apostrophe or a space in the feet moves on to the inches, and a
 * pasted 5'11" fills both. A height outside `min` and `max` is explained in
 * words, in both units. It suits fitness, health and apparel forms.
 */
export function HeightField({
  value,
  defaultValue = null,
  onValueChange,
  unit: unitProp,
  defaultUnit,
  onUnitChange,
  min = 50,
  max = 250,
  locale = "en-US",
  name,
  disabled,
  id,
  labels: labelOverrides,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: HeightFieldProps) {
  const base = useId();
  const messageId = `${base}-message`;
  const equalsId = `${base}-equals`;
  const labels: HeightLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [ownUnit, setOwnUnit] = useState<HeightUnit>(() => defaultUnit ?? defaultUnitFor(locale));
  const unit = unitProp ?? ownUnit;
  const [own, setOwn] = useState<number | null>(defaultValue);
  const current = value === undefined ? own : value;
  const [drafts, setDrafts] = useState<Drafts>(() => draftsFor(current));
  const [synced, setSynced] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const reported = useRef<number | null | undefined>(undefined);
  const refs = useRef<Partial<Record<keyof Drafts, HTMLInputElement | null>>>({});

  // A height that arrives from outside replaces what is typed; an echo of what was just reported changes nothing.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== reported.current) {
      setDrafts(draftsFor(value));
      setError(null);
      setNote(null);
    }
  }

  useEffect(trackPress, []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [said]);

  const spoken = (cm: number) => (unit === "cm" ? writeCentimetres(cm, locale, labels.cm) : writeFeetInches(cm, locale, labels.ft, labels.in));
  const otherWay = (cm: number) => (unit === "cm" ? writeFeetInches(cm, locale, labels.ft, labels.in) : writeCentimetres(cm, locale, labels.cm));

  /** What is wrong with this height, in words, or null. An empty field is not wrong: a form says what is required. */
  function problemOf(cm: number | null): string | null {
    if (cm === null) return null;
    if (cm < min) return labels.atLeast(spoken(min), otherWay(min));
    if (cm > max) return labels.atMost(spoken(max), otherWay(max));
    return null;
  }

  function report(cm: number | null) {
    if (cm === reported.current && cm === current) return;
    reported.current = cm;
    if (value === undefined) setOwn(cm);
    onValueChange?.(cm, { valid: cm !== null && cm >= min && cm <= max });
  }

  /** The height in the fields as they are now, with the draft they would be if the person left. */
  function read(from: Drafts): { cm: number | null; metres: string | null; drafts: Drafts } {
    if (unit === "cm") {
      const parsed = parseCentimetres(from.cm);
      return { cm: parsed?.cm ?? null, metres: parsed?.metres ? from.cm : null, drafts: { ...from, cm: parsed ? String(parsed.cm) : "" } };
    }
    const cm = fromFeetInches(from);
    if (cm === null) return { cm, metres: null, drafts: { ...from, feet: "", inches: "" } };
    // Inches above 11 roll into feet.
    const total = Number(from.feet || 0) * 12 + Number(from.inches || 0);
    return { cm, metres: null, drafts: { ...from, feet: String(Math.floor(total / 12)), inches: String(total % 12) } };
  }

  function edit(next: Drafts) {
    setDrafts(next);
    setNote(null);
    const cm = unit === "cm" ? (parseCentimetres(next.cm)?.cm ?? null) : fromFeetInches(next);
    // A message that is already showing follows the typing and goes as soon as the height is right. A new one waits for the field to be left.
    setError((now) => (now === null ? null : problemOf(cm)));
    report(cm);
  }

  function change(field: keyof Drafts, event: ChangeEvent<HTMLInputElement>) {
    const text = field === "cm" ? tidyCentimetres(event.target.value) : tidyWhole(event.target.value);
    edit({ ...drafts, [field]: text });
  }

  /** The field is left: the height is written plainly (inches rolled into feet), and said if it was read as metres or is out of range. */
  function commit() {
    const settled = read(drafts);
    setDrafts(settled.drafts);
    const problem = problemOf(settled.cm);
    const metres = settled.metres !== null && settled.cm !== null ? labels.metres(settled.metres, writeCentimetres(settled.cm, locale, labels.cm)) : null;
    whenReleased(() => {
      setError(problem);
      setNote(problem ? null : metres);
      if (metres) setSaid(metres);
    });
  }

  function go(field: keyof Drafts) {
    refs.current[field]?.focus();
    refs.current[field]?.select();
  }

  function step(field: keyof Drafts, delta: number) {
    // An empty field starts at a height most adults are near, whichever way the key points.
    if (field === "cm" ? drafts.cm === "" : drafts.feet === "" && drafts.inches === "") {
      edit(draftsFor(Math.min(max, Math.max(min, START))));
      return;
    }
    if (field === "cm") {
      edit({ ...drafts, cm: String(Math.max(0, (parseCentimetres(drafts.cm)?.cm ?? START) + delta)) });
      return;
    }
    let feet = Number(drafts.feet || 0);
    let inches = Number(drafts.inches || 0);
    if (field === "feet") feet = Math.max(0, feet + delta);
    else {
      inches += delta;
      // The inches turn over into the next foot, as a tape measure does.
      if (inches > 11) [feet, inches] = [feet + 1, 0];
      else if (inches < 0) [feet, inches] = feet > 0 ? [feet - 1, 11] : [0, 0];
    }
    edit({ ...drafts, feet: String(feet), inches: String(inches) });
  }

  function keyDown(field: keyof Drafts, event: KeyboardEvent<HTMLInputElement>) {
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
    const { key } = event;
    if (key === "ArrowUp" || key === "ArrowDown") {
      event.preventDefault();
      step(field, (key === "ArrowUp" ? 1 : -1) * (field === "cm" && event.shiftKey ? 10 : 1));
    } else if (key === "Enter") {
      commit();
    } else if (field === "feet" && (key === "'" || key === '"' || key === " " || key === "-") && drafts.feet !== "") {
      // The mark after the feet, or a space, hands over to the inches.
      event.preventDefault();
      go("inches");
    } else if (field === "inches" && key === "Backspace" && drafts.inches === "") {
      go("feet");
    }
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    if (unit !== "ftin") return;
    const found = parseFeetInches(event.clipboardData.getData("text"));
    if (!found) return;
    event.preventDefault();
    edit({ ...drafts, feet: String(found.feet), inches: String(found.inches) });
  }

  function switchTo(next: string) {
    const target: HeightUnit = next === "ftin" ? "ftin" : "cm";
    if (target === unit) return;
    // The height is converted from what is stored, so going to and fro never drifts.
    const cm = current;
    setDrafts(draftsFor(cm));
    setError(null);
    setNote(null);
    if (unitProp === undefined) setOwnUnit(target);
    onUnitChange?.(target);
    if (cm !== null) setSaid(labels.switched(target === "cm" ? labels.centimetresName : labels.feetInchesName, target === "cm" ? writeCentimetres(cm, locale, labels.cm) : writeFeetInches(cm, locale, labels.ft, labels.in)));
  }

  // The empty space in the field is part of the field: a click there puts the cursor in the first number.
  function focusFirst(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) go(unit === "cm" ? "cm" : "feet");
  }

  const invalid = error !== null;
  const shown = current === null ? null : otherWay(current);
  const input = (field: keyof Drafts, label: string, className: string) => (
    <InputGroupInput
      ref={(node) => {
        refs.current[field] = node;
      }}
      id={field === "cm" || field === "feet" ? id : undefined}
      type="text"
      role="spinbutton"
      inputMode={field === "cm" ? "decimal" : "numeric"}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      disabled={disabled}
      placeholder="0"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={[describedBy, shown === null ? "" : equalsId, messageId].filter(Boolean).join(" ")}
      aria-valuenow={drafts[field] === "" || Number.isNaN(Number(drafts[field])) ? undefined : Number(drafts[field])}
      value={drafts[field]}
      onChange={(event) => change(field, event)}
      onKeyDown={(event) => keyDown(field, event)}
      onPaste={paste}
      className={cn(NUMBER, className)}
    />
  );

  return (
    <div data-slot="height-field" className={cn("grid w-full min-w-0 grid-cols-1", className)} {...props}>
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup
          role="group"
          aria-label={labelledBy ? undefined : (ariaLabel ?? labels.group)}
          aria-labelledby={labelledBy}
          onClick={focusFirst}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) commit();
          }}
          className={cn("min-w-44 flex-1 cursor-text pl-3", invalid && WRONG)}
        >
          {unit === "cm" ? (
            <>
              {input("cm", labels.centimetres, "w-11")}
              <InputGroupAddon aria-hidden="true" className="pr-0 pl-1.5">
                {labels.cm}
              </InputGroupAddon>
            </>
          ) : (
            <>
              {input("feet", labels.feet, "w-6")}
              <InputGroupAddon aria-hidden="true" className="px-1.5">
                {labels.ft}
              </InputGroupAddon>
              {input("inches", labels.inches, "w-7")}
              <InputGroupAddon aria-hidden="true" className="px-1.5">
                {labels.in}
              </InputGroupAddon>
            </>
          )}
          {shown === null ? null : (
            <span id={equalsId} suppressHydrationWarning className="ml-auto min-w-0 truncate pr-3 pl-2 text-[0.8125rem] text-muted-foreground tabular-nums">
              &asymp; {shown}
            </span>
          )}
        </InputGroup>
        <SegmentedControl
          label={labels.unit}
          value={unit}
          onValueChange={switchTo}
          options={[
            { value: "cm", label: labels.centimetresShort, disabled },
            { value: "ftin", label: labels.feetInchesShort, disabled },
          ]}
          className="h-9 shrink-0 gap-0.5 rounded-md p-[3px] [&_button]:rounded-[5px] [&_button]:px-2.5 [&_button]:py-0 [&_button]:text-[0.8125rem]"
        />
      </div>
      <div id={messageId} aria-live="polite">
        {error ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
        ) : note ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {note}
          </p>
        ) : null}
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? <input type="hidden" name={name} value={current ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
