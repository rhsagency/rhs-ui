"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconEye, IconEyeOff } from "@rhs-ui/icons";
import { DEFAULT_OPTIONS, EMPTY, fieldsOf, type DeliveryField, type DeliveryInstructionsValue, type DeliveryOption } from "@rhs-ui/commerce/delivery-instructions/instructions";
import { Badge } from "@rhs-ui/primitives/badge";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { TextareaCounter } from "@rhs-ui/primitives/textarea-counter";
import { cn } from "@/lib/utils";

export type { DeliveryField, DeliveryInstructionsValue, DeliveryOption } from "@rhs-ui/commerce/delivery-instructions/instructions";

export interface DeliveryInstructionsLabels {
  /** The fieldset's name. */
  legend?: string;
  /** Under it. */
  description?: string;
  /** What a screen reader hears as the name of the choice. */
  dropOff?: string;
  /** The neighbour field, and the line under it. */
  neighbour?: string;
  neighbourHint?: string;
  /** The code field, the line under it, and the button that shows and hides it. */
  code?: string;
  codeHint?: string;
  /** The button's name. It is a toggle: a screen reader hears whether it is pressed. */
  showCode?: string;
  /** The phone field, and the line under it. */
  phone?: string;
  phoneHint?: string;
  /** The note, and what its box suggests. */
  note?: string;
  notePlaceholder?: string;
  /** The checkbox. */
  saveAsDefault?: string;
  /** Under it while it is not ticked. */
  thisOrderOnly?: string;
  /** Under it once it is ticked. */
  asDefault?: string;
  /** What a screen reader hears after a choice. `{option}` is the choice and `{fields}` the fields that appeared, in a list. */
  announce?: string;
  /** The same when the choice needs nothing more. `{option}`. */
  announceNone?: string;
}

const WORDS = {
  legend: "Delivery instructions",
  description: "Tell the courier where to leave your parcel. We put the safest choice first.",
  dropOff: "Where should the courier leave it?",
  neighbour: "Neighbour's address",
  neighbourHint: "The number and name on their door, for example 14, Van Dijk.",
  code: "Access or gate code",
  codeHint: "For a gate, an entry phone or a key safe.",
  showCode: "Show the code",
  phone: "Phone number for the courier",
  phoneHint: "Used only if the courier cannot find you.",
  note: "Note for the courier",
  notePlaceholder: "For example: the blue door at the back, the bell does not work.",
  saveAsDefault: "Save as my default for future orders",
  thisOrderOnly: "These instructions apply to this order only.",
  asDefault: "We will use these for your next orders too. You can change them in your account.",
  announce: "{option} selected. Now showing: {fields}.",
  announceNone: "{option} selected. Nothing more to fill in.",
} satisfies Required<DeliveryInstructionsLabels>;

export interface DeliveryInstructionsProps extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children"> {
  /** The instructions, for a controlled field. Pair it with `onChange`. */
  value?: DeliveryInstructionsValue;
  /** What to start with when the field keeps its own state. The first choice is chosen when none is given. */
  defaultValue?: Partial<DeliveryInstructionsValue>;
  /** Called with the whole value on every change. */
  onChange?: (value: DeliveryInstructionsValue) => void;
  /** The ways to receive the parcel, safest first. Each says which extra fields it needs. Defaults to hand over, the door, a neighbour and a parcel locker. */
  options?: readonly DeliveryOption[];
  /** How many characters the note may have. Defaults to 200. */
  noteLimit?: number;
  /** Whether a phone number for the courier is asked for. Defaults to true. */
  showPhone?: boolean;
  /** Always pass your application locale, so the list read out after a choice is joined the same way on the server and in the browser. */
  locale?: string;
  /** The words, for another language. */
  labels?: DeliveryInstructionsLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * Where the courier should leave the parcel: a choice between handing it over, the door, a neighbour and a parcel
 * locker, each card saying what could go wrong, with the safe one first. Then only the fields that choice needs
 * appear, in place and announced: the neighbour's address, an access or gate code (masked, with a button to show
 * it), a phone number for the courier and a note with a character counter. "Save as default" is a checkbox, and a
 * line under it says in words whether the instructions are for this order only or for the next ones too. It heads
 * off the failed delivery that starts with an unreadable address line.
 */
export function DeliveryInstructions({
  value,
  defaultValue,
  onChange,
  options = DEFAULT_OPTIONS,
  noteLimit = 200,
  showPhone = true,
  locale = "en-US",
  labels,
  className,
  ...props
}: DeliveryInstructionsProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState<DeliveryInstructionsValue>({ ...EMPTY, dropOff: options[0]?.value ?? "", ...defaultValue });
  const [shown, setShown] = useState(false);
  const [said, setSaid] = useState("");
  const current = value ?? own;
  const option = options.find((entry) => entry.value === current.dropOff);
  const fields = fieldsOf(option, showPhone);
  const names: Record<DeliveryField, string> = { neighbour: words.neighbour, code: words.code, phone: words.phone, note: words.note };
  const dropOff = current.dropOff;
  const spoken = fields.join(",");
  const lastKey = useRef(`${dropOff}|${spoken}`);

  function update(patch: Partial<DeliveryInstructionsValue>) {
    const next = { ...current, ...patch };
    if (value === undefined) setOwn(next);
    onChange?.(next);
  }

  // The choice is said out loud once it has changed, with the fields that came with it. What was said last is remembered, so the first render says nothing.
  useEffect(() => {
    const key = `${dropOff}|${spoken}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    const entry = options.find((candidate) => candidate.value === dropOff);
    if (!entry) return;
    const list = spoken ? new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(spoken.split(",").map((field) => names[field as DeliveryField])) : "";
    setSaid(list ? fill(words.announce, { option: entry.title, fields: list }) : fill(words.announceNone, { option: entry.title }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a change of choice is announced, not a change of the words
  }, [dropOff, spoken]);

  const field = "starting:-translate-y-1 starting:opacity-0 transition-[opacity,translate] duration-200 motion-reduce:transition-none";
  // The code and the phone number share a row; when only one of them is asked for, it takes the whole row instead of leaving half of it empty.
  const paired = fields.includes("code") && fields.includes("phone");

  return (
    <fieldset data-slot="delivery-instructions" className={cn("min-w-0 border-0 p-0", className)} {...props}>
      <legend className="p-0 text-base font-semibold tracking-[-0.02em]">{words.legend}</legend>
      <p className="mt-1 text-sm text-muted-foreground">{words.description}</p>

      {/* Everything below answers to the width of this box, not of the screen: in a checkout drawer or a side column on a wide screen the cards stay one above the other until there is room for two. */}
      <div className="@container mt-5 grid gap-5">
        <RadioCards
          label={words.dropOff}
          options={options.map((entry) => ({
            value: entry.value,
            title: entry.title,
            description: entry.description,
            icon: entry.icon,
            aside: entry.flag ? <Badge variant="secondary">{entry.flag}</Badge> : undefined,
          }))}
          value={current.dropOff}
          onValueChange={(next) => update({ dropOff: next })}
          columns={1}
          className="@xl:grid-cols-2"
        />

        {fields.length > 0 ? (
          <div className={cn("grid gap-5 rounded-xl border border-border bg-muted/40 p-4 @lg:grid-cols-2 @lg:p-5", field)}>
            {fields.includes("neighbour") ? (
              <FormField described className={cn(field, "@lg:col-span-2")}>
                <FormLabel>{words.neighbour}</FormLabel>
                <FormControl>
                  <Input name="neighbour" autoComplete="off" value={current.neighbour} onChange={(event) => update({ neighbour: event.target.value })} />
                </FormControl>
                <FormDescription>{words.neighbourHint}</FormDescription>
              </FormField>
            ) : null}

            {fields.includes("code") ? (
              <FormField described className={cn(field, !paired && "@lg:col-span-2")}>
                <FormLabel>{words.code}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      name="access-code"
                      type={shown ? "text" : "password"}
                      autoComplete="off"
                      spellCheck={false}
                      data-1p-ignore=""
                      data-lpignore="true"
                      className="pr-10"
                      value={current.code}
                      onChange={(event) => update({ code: event.target.value })}
                    />
                  </FormControl>
                  <button
                    type="button"
                    aria-label={words.showCode}
                    aria-pressed={shown}
                    onClick={() => setShown((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    {shown ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
                <FormDescription>{words.codeHint}</FormDescription>
              </FormField>
            ) : null}

            {fields.includes("phone") ? (
              <FormField described className={cn(field, !paired && "@lg:col-span-2")}>
                <FormLabel>{words.phone}</FormLabel>
                <FormControl>
                  <Input name="courier-phone" type="tel" autoComplete="tel" inputMode="tel" value={current.phone} onChange={(event) => update({ phone: event.target.value })} />
                </FormControl>
                <FormDescription>{words.phoneHint}</FormDescription>
              </FormField>
            ) : null}

            {fields.includes("note") ? (
              <FormField className={cn(field, "@lg:col-span-2")}>
                <FormLabel>{words.note}</FormLabel>
                <FormControl>
                  <TextareaCounter name="courier-note" limit={noteLimit} rows={3} placeholder={words.notePlaceholder} value={current.note} onChange={(event) => update({ note: event.target.value })} />
                </FormControl>
              </FormField>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <div className="flex items-center gap-3">
            <Checkbox id={`${id}-default`} checked={current.saveAsDefault} onCheckedChange={(checked) => update({ saveAsDefault: checked === true })} aria-describedby={`${id}-scope`} />
            <Label htmlFor={`${id}-default`} className="cursor-pointer font-normal">
              {words.saveAsDefault}
            </Label>
          </div>
          <p id={`${id}-scope`} className="pl-[30px] text-xs text-muted-foreground">
            {current.saveAsDefault ? words.asDefault : words.thisOrderOnly}
          </p>
        </div>
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>
    </fieldset>
  );
}
