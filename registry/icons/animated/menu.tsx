import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/**
 * Three lines that fold into a cross. Set `active` while the menu is open.
 * The outer lines first slide to the middle, then turn; closing runs the
 * other way round. The delays follow STATE_PART's property order:
 * opacity, scale, rotate, translate, stroke-dashoffset.
 */
const FOLD = "duration-200 [transition-delay:0ms,0ms,0ms,140ms,0ms] group-data-[active=true]/rhs-icon:[transition-delay:0ms,0ms,140ms,0ms,0ms]";

export function IconMenuAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path
        className={cn(STATE_PART, FOLD, "origin-[12px_7px] group-data-[active=true]/rhs-icon:translate-y-[5px] group-data-[active=true]/rhs-icon:rotate-45")}
        d="M4 7h16"
      />
      <path
        className={cn(STATE_PART, "origin-[12px_12px] duration-150 group-data-[active=true]/rhs-icon:scale-x-0 group-data-[active=true]/rhs-icon:opacity-0")}
        d="M4 12h16"
      />
      <path
        className={cn(STATE_PART, FOLD, "origin-[12px_17px] group-data-[active=true]/rhs-icon:-translate-y-[5px] group-data-[active=true]/rhs-icon:-rotate-45")}
        d="M4 17h16"
      />
    </StateGlyph>
  );
}
