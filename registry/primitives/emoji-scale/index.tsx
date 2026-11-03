"use client";

import { useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { Face, FACE_COUNT, FACE_SIZES, FACE_WORDS, type FaceSize } from "@rhs-ui/primitives/emoji-scale/faces";
import { cn } from "@/lib/utils";

export type { FaceSize } from "@rhs-ui/primitives/emoji-scale/faces";

export interface EmojiScaleProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The question the scale answers: "How was your delivery?". It heads the field and names the group for a screen reader. */
  legend: ReactNode;
  /** The chosen face, 1 (awful) to 5 (great), or null for none. Use it to control the scale. */
  value?: number | null;
  /** The face to start on, when you do not control the scale. */
  defaultValue?: number | null;
  /** Called with the number of the face that was chosen, 1 to 5. */
  onValueChange?: (value: number) => void;
  /** The five words, worst first. Each one names its face for assistive technology. Default Awful, Bad, Okay, Good and Great. */
  labels?: readonly [string, string, string, string, string];
  /** Write the word of a face under the row: the one pointed at or focused, else the chosen one. The words are always there for a screen reader. Default true. */
  showLabels?: boolean;
  /** What the line under the row says while nothing is chosen or pointed at. Default "Choose a face". */
  placeholder?: string;
  /** The size of the faces, 24px (sm), 32px (md) or 40px (lg). Every face sits in a target of 44px or more. Default md. */
  size?: FaceSize;
  /** The field's name for a plain form submit: the number of the chosen face, 1 to 5. */
  name?: string;
  /** An answer is needed: the group says so to assistive technology, and a form with it will not submit without one. */
  required?: boolean;
  /** Turn the whole scale off. */
  disabled?: boolean;
}

const FACE =
  "group/face relative isolate grid aspect-square w-full place-items-center justify-self-center rounded-full text-muted-foreground outline-none " +
  "transition-[color,scale,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none " +
  "hover:bg-muted hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 " +
  "data-[state=checked]:text-foreground motion-safe:data-[state=checked]:scale-110 " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground";

/**
 * A mood or satisfaction input of five faces, from awful to great. It is a real
 * radio group, so Tab enters it once, the arrow keys move and choose, and a
 * screen reader hears the word of each face ("Good, 4 of 5"). The faces differ
 * in shape and not in colour, so they work in monochrome and for colour-blind
 * people; the chosen one fills its disc and grows a little (not under reduced
 * motion). Pointing at or focusing a face writes its word under the row
 * without choosing it, and the chosen word is announced politely. The faces
 * are drawn inline, in targets of 44px or more, so the item needs no icons.
 */
export function EmojiScale({
  legend,
  value,
  defaultValue = null,
  onValueChange,
  labels = FACE_WORDS,
  showLabels = true,
  placeholder = "Choose a face",
  size = "md",
  name,
  required,
  disabled,
  className,
  ...props
}: EmojiScaleProps) {
  const legendId = `${useId()}-legend`;
  const [own, setOwn] = useState<number | null>(defaultValue);
  const [pointed, setPointed] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const raw = value === undefined ? own : value;
  const current = raw !== null && Number.isInteger(raw) && raw >= 1 && raw <= FACE_COUNT ? raw : null;
  const shown = pointed ?? focused ?? current;
  const sizes = FACE_SIZES[size];

  return (
    <div data-slot="emoji-scale" data-size={size} className={cn("w-full min-w-0", className)} {...props}>
      <p id={legendId} className="text-sm leading-5 font-medium">
        {legend}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-muted-foreground">
            *
          </span>
        ) : null}
      </p>
      <RadioGroupPrimitive.Root
        aria-labelledby={legendId}
        name={name}
        required={required}
        disabled={disabled}
        value={current === null ? "" : String(current)}
        onValueChange={(next) => {
          const face = Number(next);
          if (!Number.isInteger(face)) return;
          if (value === undefined) setOwn(face);
          onValueChange?.(face);
        }}
        onPointerLeave={() => setPointed(null)}
        // Five equal columns, never wider than a face and its target: on a narrow screen the faces close up instead of running off the side.
        className={cn("mt-2 grid w-full grid-cols-5 gap-1", sizes.pull)}
        style={{ maxWidth: `${sizes.px * FACE_COUNT + 4 * FACE_COUNT - 4}px` } as CSSProperties}
      >
        {Array.from({ length: FACE_COUNT }, (_, index) => {
          const face = index + 1;
          return (
            <RadioGroupPrimitive.Item
              key={face}
              value={String(face)}
              aria-label={labels[index]}
              data-slot="emoji-scale-face"
              className={cn(FACE, sizes.target, sizes.face)}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") setPointed(face);
              }}
              onFocus={() => setFocused(face)}
              onBlur={() => setFocused(null)}
            >
              <Face level={face} />
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>

      {showLabels ? (
        // The row of faces says everything to a screen reader already, so the word line is for the eye. A preview is quieter than the choice.
        <p
          aria-hidden="true"
          className={cn(
            "mt-2 h-5 text-sm leading-5 transition-colors duration-150 motion-reduce:transition-none",
            shown !== null && shown === current ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {shown === null ? placeholder : labels[shown - 1]}
        </p>
      ) : null}
      <span role="status" aria-live="polite" className="sr-only">
        {current === null ? "" : labels[current - 1]}
      </span>
    </div>
  );
}
