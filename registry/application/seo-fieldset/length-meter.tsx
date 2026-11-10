import { IconAlertCircle, IconCheck, IconCircle } from "@rhs-ui/icons";
import { fill, fitOf, type Words } from "@rhs-ui/application/seo-fieldset/seo";
import { cn } from "@/lib/utils";

export interface LengthMeterProps {
  /** The id of the line that says where the length stands: the field points at it. */
  id: string;
  /** Names the meter for a screen reader: "Search title length". */
  label: string;
  count: number;
  /** The shortest length that is recommended. */
  min: number;
  /** The longest length before the text is cut off. */
  limit: number;
  words: Words;
}

/**
 * A length against a recommended range, in a bar and in words. The bar fills
 * as the text grows towards the limit, a tick marks where the recommended
 * range begins, and the line under it says the same in words with an icon: a
 * ring while it is empty or short, a check in range, a warning once the text
 * would be cut off.
 */
export function LengthMeter({ id, label, count, min, limit, words }: LengthMeterProps) {
  const fit = fitOf(count, min, limit);
  const sentence = fit === "empty" ? words.empty : fit === "long" ? fill(words.long, { limit }) : fill(fit === "good" ? words.good : words.short, { count, limit });
  const hint = fit === "long" ? fill(words.over, { count: count - limit }) : fill(words.range, { min, limit });
  const share = Math.min(1, count / limit);
  const Icon = fit === "long" ? IconAlertCircle : fit === "good" ? IconCheck : IconCircle;
  return (
    <div data-slot="seo-fieldset-meter" data-fit={fit} className="grid gap-2">
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(count, limit)} aria-valuetext={sentence} className="relative h-1.5">
        <span className="absolute inset-0 overflow-hidden rounded-full bg-muted">
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
              fit === "long" ? "bg-destructive" : fit === "good" ? "bg-foreground" : "bg-muted-foreground/60",
            )}
            style={{ width: `${share * 100}%` }}
          />
        </span>
        {/* Where the recommended range begins: a tick that stands out above and below the bar. */}
        <span aria-hidden="true" className="absolute -inset-y-[3px] w-px -translate-x-1/2 rounded-full bg-muted-foreground/50" style={{ left: `${(Math.min(min, limit) / limit) * 100}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs leading-4">
        <p id={id} className={cn("flex items-center gap-1.5 tabular-nums", fit === "long" ? "font-medium text-destructive" : fit === "good" ? "font-medium text-foreground" : "text-muted-foreground")}>
          <Icon aria-hidden="true" className="size-3.5 shrink-0" />
          {sentence}
        </p>
        <p className={cn("tabular-nums", fit === "long" ? "font-medium text-destructive" : "text-muted-foreground")}>{hint}</p>
      </div>
    </div>
  );
}
