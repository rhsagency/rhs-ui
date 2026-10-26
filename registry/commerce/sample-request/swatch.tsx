import { IconCheck } from "@rhs-ui/icons";
import type { Swatch } from "@rhs-ui/commerce/sample-request/samples";
import { cn } from "@/lib/utils";

/** The look of a sample: its colour, covered by its picture when it has one. Decorative, the name is always beside it. */
export function SwatchFace({ swatch, className }: { swatch: Swatch; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative block overflow-hidden bg-muted ring-1 ring-foreground/10 ring-inset", className)} style={swatch.color ? { backgroundColor: swatch.color } : undefined}>
      {swatch.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is decorative, the name is beside it
        <img src={swatch.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      ) : null}
    </span>
  );
}

export interface SwatchTileProps {
  /** The sample this tile stands for. */
  swatch: Swatch;
  /** Whether it is chosen. */
  checked: boolean;
  /** True for a sample that cannot be added now because the limit is reached. A chosen sample is never disabled. */
  disabled: boolean;
  /** The id of the text that says why a sample is disabled. */
  describedBy?: string;
  /** Called when the tile is clicked, or Space is pressed on it. */
  onToggle: () => void;
}

/**
 * One sample in the grid, as a real checkbox: the swatch with the name under it, outlined and checked once chosen,
 * dimmed when the limit is reached. The checkbox itself is hidden and the whole tile is its label; the swatch is
 * outlined for hover and for a choice, and the keyboard's focus is a ring around it. It keeps no state: the grid decides what is chosen.
 */
export function SwatchTile({ swatch, checked, disabled, describedBy, onToggle }: SwatchTileProps) {
  return (
    <label data-slot="sample-request-swatch" className={cn("group/swatch relative grid content-start gap-2.5", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input type="checkbox" checked={checked} disabled={disabled} aria-describedby={describedBy} onChange={onToggle} className="sr-only" />
      {/* The padding holds the choice's outline; the keyboard's focus is a soft ring outside it, so a tile that is chosen and a tile that has focus never look the same. */}
      <span className="relative -m-[5px] block rounded-2xl p-[5px] transition-shadow duration-150 group-has-[:focus-visible]/swatch:ring-[3px] group-has-[:focus-visible]/swatch:ring-ring/45 motion-reduce:transition-none">
        <SwatchFace
          swatch={swatch}
          className={cn(
            "aspect-square w-full rounded-xl outline-2 outline-offset-2 outline-transparent transition-[outline-color,opacity] duration-150 motion-reduce:transition-none",
            !disabled && !checked && "group-hover/swatch:outline-foreground/25",
            checked && "outline-foreground",
            disabled && "opacity-40",
          )}
        />
        <span
          aria-hidden="true"
          className="absolute top-[0.9375rem] right-[0.9375rem] grid size-6 scale-75 place-items-center rounded-full bg-foreground text-background opacity-0 shadow-xs transition-[opacity,transform] duration-150 group-has-[:checked]/swatch:scale-100 group-has-[:checked]/swatch:opacity-100 motion-reduce:transition-none"
        >
          <IconCheck className="size-3.5" strokeWidth={2.5} />
        </span>
      </span>
      <span className={cn("grid gap-0.5", disabled && "text-muted-foreground")}>
        <span className={cn("text-sm leading-snug text-pretty", checked ? "font-semibold" : "font-medium")}>{swatch.name}</span>
        {swatch.note ? <span className="text-xs leading-snug text-muted-foreground">{swatch.note}</span> : null}
      </span>
    </label>
  );
}
