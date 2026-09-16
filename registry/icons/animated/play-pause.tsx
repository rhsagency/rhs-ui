import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/** Play turns into pause. Set `active` while something is playing. */
export function IconPlayPauseAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path
        className={cn(STATE_PART, "origin-[12px_12px] group-data-[active=true]/rhs-icon:scale-75 group-data-[active=true]/rhs-icon:opacity-0")}
        d="M7 4.5v15l12-7.5z"
      />
      <path
        className={cn(
          STATE_PART,
          "origin-[12px_12px] scale-75 opacity-0 group-data-[active=true]/rhs-icon:scale-100 group-data-[active=true]/rhs-icon:opacity-100 group-data-[active=true]/rhs-icon:delay-75",
        )}
        d="M8.5 5v14M15.5 5v14"
      />
    </StateGlyph>
  );
}
