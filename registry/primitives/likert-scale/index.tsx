"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconAlertCircle } from "@rhs-ui/icons";
import { agreementOptions, fromRadio, NOT_APPLICABLE, toRadio, type LikertValue } from "@rhs-ui/primitives/likert-scale/scale";
import { cn } from "@/lib/utils";

export type { LikertValue } from "@rhs-ui/primitives/likert-scale/scale";

export interface LikertScaleProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The statement people agree or disagree with. It is the legend of the group and names it for a screen reader. */
  legend: ReactNode;
  /** A line under the statement that says more. */
  description?: ReactNode;
  /** How many points the default scale has, from Strongly disagree to Strongly agree. Ignored when you pass `options`. Default 5. */
  points?: 5 | 7;
  /** Your own labels, first point first: `["Never", "Rarely", "Sometimes", "Often", "Always"]`. Every one is written out in full, so the middle is as clear as the ends. */
  options?: readonly string[];
  /** The chosen point, counted from 1, or "na" for Not applicable, or null for no answer. Use it to control the scale. */
  value?: LikertValue;
  /** The answer to start with, when you do not control the scale. */
  defaultValue?: LikertValue;
  /** Called with the number of the point chosen, or "na". */
  onValueChange?: (value: number | "na") => void;
  /** An answer is needed: the group says so to assistive technology and marks the statement, and a form with it refuses to submit until one is chosen. Once the group is left or the form is submitted, the missing answer shows as an error. Default false. */
  required?: boolean;
  /** Write the number of each point inside its circle, 1 to 5. Default false. */
  showNumbers?: boolean;
  /** Add a Not applicable choice that stands apart from the scale: `true` for those words, or your own label. Default none. */
  notApplicable?: boolean | string;
  /** The error when a required answer is missing. Default "Choose an answer". */
  requiredMessage?: string;
  /** An error from outside, such as a server answer. It shows under the group and marks it invalid. */
  error?: string;
  /** The field's name for a plain form submit: the number of the point, or "na". */
  name?: string;
  /** Turn the whole scale off. */
  disabled?: boolean;
}

const POINT = [
  "group/point relative isolate flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2.5 text-left outline-none",
  "focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
  // Wide enough for a row: no box, the circle on top and the words under it.
  "@[520px]:min-h-0 @[520px]:flex-col @[520px]:gap-2.5 @[520px]:px-1 @[520px]:py-0 @[520px]:pb-1 @[520px]:text-center",
].join(" ");

const ASIDE = [
  "group/point relative isolate flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2.5 text-left outline-none",
  "focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
  "@[520px]:min-h-10 @[520px]:w-fit @[520px]:py-1.5 @[520px]:pr-4",
].join(" ");

/** The box of a point on a narrow screen. It sits behind the content, so a wide layout just hides it. */
const CARD =
  "absolute inset-0 -z-10 rounded-lg border border-border bg-background transition-[background-color,border-color] duration-150 group-hover/point:bg-muted/50 group-data-[state=checked]/point:border-foreground group-data-[state=checked]/point:bg-muted/50 motion-reduce:transition-none";

function Circle({ number }: { number?: number }): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border border-muted-foreground/60 bg-background transition-[border-color,background-color,color] duration-150 motion-reduce:transition-none",
        "group-hover/point:border-foreground group-data-[state=checked]/point:border-foreground",
        number === undefined ? "size-5" : "size-7 text-xs font-medium text-muted-foreground tabular-nums group-data-[state=checked]/point:bg-foreground group-data-[state=checked]/point:text-background",
      )}
    >
      {number === undefined ? (
        <span className="size-2.5 scale-0 rounded-full bg-foreground transition-transform duration-150 group-data-[state=checked]/point:scale-100 motion-reduce:transition-none" />
      ) : (
        number
      )}
    </span>
  );
}

const WORDS =
  "relative text-sm leading-5 text-muted-foreground transition-colors duration-150 group-hover/point:text-foreground group-data-[state=checked]/point:font-semibold group-data-[state=checked]/point:text-foreground motion-reduce:transition-none";

/**
 * A statement with a scale of agreement: the standard of satisfaction and
 * opinion surveys. It is a radio group with the statement as its legend, so
 * Tab enters it once and the arrow keys move and choose. Every point writes
 * its full label, not only the ends, so the middle is never a guess. The
 * chosen point has a filled dot and heavier words. Where the container is
 * narrower than 520px the points become a single column of large targets. An
 * optional Not applicable choice stands apart from the scale, and a required
 * answer that is missing shows as an error under the group once it has been
 * left or the form is submitted.
 */
export function LikertScale({
  legend,
  description,
  points = 5,
  options,
  value,
  defaultValue = null,
  onValueChange,
  required = false,
  showNumbers = false,
  notApplicable = false,
  requiredMessage = "Choose an answer",
  error,
  name,
  disabled,
  className,
  ...rest
}: LikertScaleProps) {
  const base = useId();
  const legendId = `${base}-legend`;
  const descriptionId = `${base}-description`;
  const messageId = `${base}-message`;
  const labels = options ?? agreementOptions(points);
  const gate = useRef<HTMLInputElement>(null);
  const group = useRef<HTMLFieldSetElement>(null);
  const [own, setOwn] = useState<LikertValue>(defaultValue);
  const [touched, setTouched] = useState(false);
  const current = value === undefined ? own : value;
  const missing = required && current === null;
  const failed = Boolean(error) || (touched && missing);
  const message = error || (failed ? requiredMessage : "");
  const asideLabel = typeof notApplicable === "string" ? notApplicable : "Not applicable";

  // A required scale that has no answer tells the browser so: the form will not submit, the browser's own bubble is cancelled, and the
  // error appears under the group in our words.
  useEffect(() => {
    gate.current?.setCustomValidity(missing ? requiredMessage : "");
  }, [missing, requiredMessage]);

  return (
    <div data-slot="likert-scale" className={cn("@container w-full min-w-0", className)} {...rest}>
      <RadioGroupPrimitive.Root
        asChild
        name={name}
        value={toRadio(current)}
        disabled={disabled}
        onValueChange={(next) => {
          const answer = fromRadio(next);
          if (answer === null) return;
          if (value === undefined) setOwn(answer);
          onValueChange?.(answer);
        }}
      >
        <fieldset
          ref={group}
          aria-labelledby={legendId}
          aria-describedby={[description ? descriptionId : null, message ? messageId : null].filter(Boolean).join(" ") || undefined}
          aria-required={required}
          aria-invalid={failed || undefined}
          data-invalid={failed || undefined}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setTouched(true);
          }}
          className="relative m-0 min-w-0 border-0 p-0"
        >
          <legend id={legendId} className={cn("p-0 text-sm leading-5 font-medium", description ? "mb-1" : "mb-4")}>
            {legend}
            {required ? (
              <span aria-hidden="true" className="ml-1 text-muted-foreground">
                *
              </span>
            ) : null}
          </legend>
          {description ? (
            <p id={descriptionId} className="mb-4 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}

          <div className="relative grid gap-2 @[520px]:gap-0 @[520px]:[grid-template-columns:repeat(var(--points),minmax(0,1fr))]" style={{ "--points": labels.length } as CSSProperties}>
            {/* The thread the circles are strung on: only in the wide layout, from the middle of the first column to the middle of the last. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute hidden h-px bg-border @[520px]:block @[520px]:right-[calc(100%/var(--points)/2)] @[520px]:left-[calc(100%/var(--points)/2)]",
                showNumbers ? "@[520px]:top-3.5" : "@[520px]:top-2.5",
              )}
            />
            {labels.map((label, index) => (
              <RadioGroupPrimitive.Item key={`${index}-${label}`} value={String(index + 1)} data-slot="likert-scale-point" className={POINT}>
                <span aria-hidden="true" className={cn(CARD, "@[520px]:hidden")} />
                <Circle number={showNumbers ? index + 1 : undefined} />
                <span className={cn(WORDS, "@[520px]:text-[0.8125rem] @[520px]:leading-4 @[520px]:text-balance")}>{label}</span>
              </RadioGroupPrimitive.Item>
            ))}
          </div>

          {notApplicable ? (
            <div className="mt-3 @[520px]:mt-5 @[520px]:border-t @[520px]:border-border @[520px]:pt-4">
              <RadioGroupPrimitive.Item value={NOT_APPLICABLE} data-slot="likert-scale-point" className={ASIDE}>
                <span aria-hidden="true" className={CARD} />
                <Circle />
                <span className={WORDS}>{asideLabel}</span>
              </RadioGroupPrimitive.Item>
            </div>
          ) : null}

          {/* Kept in the page when empty: a live region that appears together with its message is often never read. A group that can fail on blur keeps
              its line, so the error never moves what is below it (a button that jumps away during a press loses the click); any other has no height. */}
          <p id={messageId} role="status" aria-live="polite" className={cn("flex items-start gap-1.5 text-xs leading-5 font-medium text-destructive", required ? "mt-3 min-h-5" : message ? "mt-3" : "h-0 overflow-hidden")}>
            {message ? (
              <>
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span className="sr-only">Error: </span>
                {message}
              </>
            ) : null}
          </p>

          <input
            ref={gate}
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            disabled={disabled}
            className="sr-only"
            onInvalid={(event) => {
              event.preventDefault();
              setTouched(true);
              group.current?.querySelector<HTMLElement>("[role=radio]:not(:disabled)")?.focus();
            }}
          />
        </fieldset>
      </RadioGroupPrimitive.Root>
    </div>
  );
}
