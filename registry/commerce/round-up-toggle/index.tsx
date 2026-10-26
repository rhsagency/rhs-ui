"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconHeart } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { roundUpOf, type RoundUp } from "@rhs-ui/commerce/round-up-toggle/round-up";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export type { RoundUp } from "@rhs-ui/commerce/round-up-toggle/round-up";

export interface RoundUpToggleLabels {
  /** The question, with the exact amount. `{amount}` and `{cause}`. */
  label?: string;
  /** Under it while the switch is off. `{total}` is the total as it stands. */
  off?: string;
  /** Under it while the switch is on. `{total}` is the new total. */
  on?: string;
  /** What a screen reader hears when it is switched on, or the total changes while it is on. `{amount}`, `{cause}` and `{total}`. */
  statusOn?: string;
  /** What a screen reader hears when it is switched off. `{total}`. */
  statusOff?: string;
}

const WORDS = {
  label: "Round up by {amount} for {cause}",
  off: "Your total stays {total}.",
  on: "New total {total}. Thank you.",
  statusOn: "Round up on. {amount} will go to {cause}. New total {total}.",
  statusOff: "Round up off. Total {total}.",
} satisfies Required<RoundUpToggleLabels>;

export interface RoundUpToggleProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The order total, in minor units: 2457 is 24.57. */
  total: number;
  /** What to round up to, in minor units: 100 rounds to the next whole euro, 500 to the next five. Defaults to 100. */
  step?: number;
  /** Who receives the difference: "Clean Water Fund". It is in the question, so the shopper always knows. */
  cause: string;
  /** Whether it is on, when you control it. Pair it with `onChange`. */
  checked?: boolean;
  /** Whether it starts on. Leave it off, so the option never nudges: this is for restoring the shopper's own earlier choice. */
  defaultChecked?: boolean;
  /** Called when the shopper switches it, with the new state and what rounding up comes to. Add `roundUp.amount` to the order as a donation while it is on. */
  onChange?: (checked: boolean, roundUp: RoundUp) => void;
  /** ISO 4217 code for the amounts. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser print the same amounts. */
  locale?: string;
  /** Locks the switch and dims it. */
  disabled?: boolean;
  /** The words, for another language. */
  labels?: RoundUpToggleLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Says a sentence once things settle. The first render says nothing, so the page never speaks before anyone has touched it. */
function useCalmStatus(text: string, delay = 400): string {
  const [said, setSaid] = useState("");
  const spoken = useRef(text);
  useEffect(() => {
    if (spoken.current === text) return;
    spoken.current = text;
    const timeout = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timeout);
  }, [text, delay]);
  return said;
}

/**
 * The checkout option that offers to round the total up and give the difference away. The question names the
 * exact amount and who gets it ("Round up by 0.43 for Clean Water Fund"), the switch is off until the shopper
 * turns it on, and once it is on the new total is written out under it. When the total is already a round
 * number there is nothing to give and the option is not there at all. Switching it on or off is a polite status
 * with the new total.
 */
export function RoundUpToggle({ total, step = 100, cause, checked, defaultChecked = false, onChange, currency = "EUR", locale = "en-US", disabled = false, labels, className, ...props }: RoundUpToggleProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState(defaultChecked);
  const on = checked ?? own;
  const roundUp = roundUpOf(total, step);

  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const said = useCalmStatus(
    roundUp
      ? on
        ? fill(words.statusOn, { amount: money(roundUp.amount), cause, total: money(roundUp.total) })
        : fill(words.statusOff, { total: money(total) })
      : "",
  );
  if (!roundUp) return null;

  return (
    <div
      data-slot="round-up-toggle"
      data-state={on ? "on" : "off"}
      className={cn("flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors duration-150 motion-reduce:transition-none", on && "border-foreground/30", disabled && "opacity-60", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("grid size-10 shrink-0 place-items-center rounded-full border transition-colors duration-150 motion-reduce:transition-none", on ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground")}
      >
        <IconHeart className={cn("size-4", on && "fill-current")} />
      </span>
      <label htmlFor={`${id}-switch`} className={cn("min-w-0 flex-1", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <span id={`${id}-label`} className="block text-sm leading-snug font-medium text-pretty">
          {fill(words.label, { amount: money(roundUp.amount), cause })}
        </span>
        {/* Both sentences share one cell and the one that is not true is invisible, not removed: the card is as tall switched on as off, so the switch never moves under the finger that pressed it. */}
        <span id={`${id}-text`} className="mt-0.5 grid text-xs text-muted-foreground tabular-nums">
          <span aria-hidden={on || undefined} className={cn("col-start-1 row-start-1", on && "invisible")}>
            {fill(words.off, { total: money(total) })}
          </span>
          <span aria-hidden={!on || undefined} className={cn("col-start-1 row-start-1", !on && "invisible")}>
            {fill(words.on, { total: money(roundUp.total) })}
          </span>
        </span>
      </label>
      <Switch
        id={`${id}-switch`}
        checked={on}
        disabled={disabled}
        onCheckedChange={(next) => {
          if (checked === undefined) setOwn(next);
          onChange?.(next, roundUp);
        }}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-text`}
      />
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
