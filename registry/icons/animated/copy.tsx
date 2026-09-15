import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/** Copy that turns into a check. Set `active` for the moment after a copy succeeded. */
export function IconCopyAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path
        className={cn(STATE_PART, "origin-[12px_12px] group-data-[active=true]/rhs-icon:scale-75 group-data-[active=true]/rhs-icon:opacity-0")}
        d="M17.8 9H11a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6.8M5.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5"
      />
      <path
        pathLength={1}
        strokeDasharray="1"
        className={cn(
          STATE_PART,
          "opacity-0 [stroke-dashoffset:1] group-data-[active=true]/rhs-icon:opacity-100 group-data-[active=true]/rhs-icon:[stroke-dashoffset:0] group-data-[active=true]/rhs-icon:delay-100",
        )}
        d="M5 12.5l4.5 4.5L19 7"
      />
    </StateGlyph>
  );
}
