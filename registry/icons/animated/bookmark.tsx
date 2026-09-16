import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/** The ribbon fills and drops into place. Set `active` when the item is saved. */
const RIBBON = "M14.8 3H7.5A1.5 1.5 0 0 0 6 4.5V21l6-4 6 4V6.2";

export function IconBookmarkAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path
        fill="currentColor"
        stroke="none"
        className={cn(STATE_PART, "origin-[12px_12px] scale-90 opacity-0 group-data-[active=true]/rhs-icon:scale-100 group-data-[active=true]/rhs-icon:opacity-100")}
        d="M14.8 3H7.5A1.5 1.5 0 0 0 6 4.5V21l6-4 6 4V6.2z"
      />
      <path className={cn(STATE_PART, "origin-[12px_4px] group-data-[active=true]/rhs-icon:translate-y-[1px] group-data-[active=true]/rhs-icon:delay-75")} d={RIBBON} />
    </StateGlyph>
  );
}
