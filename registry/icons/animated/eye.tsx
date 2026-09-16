import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/** The eye closes behind a line that draws itself. Set `active` when the content is hidden. */
export function IconEyeAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path
        className={cn(STATE_PART, "origin-[12px_12px] group-data-[active=true]/rhs-icon:scale-y-[0.72]")}
        d="M2.5 12C4.5 7.8 8 5.5 12 5.5s7.5 2.3 9.5 6.5c-2 4.2-5.5 6.5-9.5 6.5S4.5 16.2 2.5 12z"
      />
      <path
        className={cn(STATE_PART, "origin-[12px_12px] group-data-[active=true]/rhs-icon:scale-50 group-data-[active=true]/rhs-icon:opacity-0")}
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
      />
      <path
        pathLength={1}
        strokeDasharray="1"
        className={cn(
          STATE_PART,
          "opacity-0 [stroke-dashoffset:1] group-data-[active=true]/rhs-icon:opacity-100 group-data-[active=true]/rhs-icon:[stroke-dashoffset:0]",
        )}
        d="M4.5 4.5l15 15"
      />
    </StateGlyph>
  );
}
