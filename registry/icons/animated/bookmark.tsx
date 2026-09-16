import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/** The complete ribbon fills in place. Set `active` when the item is saved. */
const RIBBON = "M7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5A1.5 1.5 0 0 1 7.5 3z";

export function IconBookmarkAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path
        fill="currentColor"
        stroke="none"
        className={cn(STATE_PART, "origin-[12px_12px] scale-90 opacity-0 group-data-[active=true]/rhs-icon:scale-100 group-data-[active=true]/rhs-icon:opacity-100")}
        d={RIBBON}
      />
      <path d={RIBBON} />
    </StateGlyph>
  );
}
