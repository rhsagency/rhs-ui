import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/** A padlock that springs open. Set `active` when whatever it guards is unlocked. */
export function IconLockAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path
        className={cn(STATE_PART, "origin-[12px_9px] group-data-[active=true]/rhs-icon:-translate-y-[1.5px] group-data-[active=true]/rhs-icon:opacity-0")}
        d="M8 10.5V7a4 4 0 0 1 8 0v3.5"
      />
      <path
        className={cn(
          STATE_PART,
          "origin-[12px_9px] translate-y-[1.5px] opacity-0 group-data-[active=true]/rhs-icon:translate-y-0 group-data-[active=true]/rhs-icon:opacity-100 group-data-[active=true]/rhs-icon:delay-100",
        )}
        d="M8 10.5V7a4 4 0 0 1 7.7-1.5"
      />
      <path d="M16.8 10.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.3" />
      <path className={cn(STATE_PART, "origin-[12px_16px] group-data-[active=true]/rhs-icon:scale-y-75")} d="M12 15v2.5" />
    </StateGlyph>
  );
}
