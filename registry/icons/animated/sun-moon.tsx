import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/** The sun draws in its rays and turns into the moon. Set `active` for dark. */
export function IconSunMoonAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path
        className={cn(STATE_PART, "origin-[12px_12px] group-data-[active=true]/rhs-icon:scale-50 group-data-[active=true]/rhs-icon:opacity-0")}
        d="M15.63 10.31A4 4 0 1 1 13.69 8.37"
      />
      <path
        className={cn(
          STATE_PART,
          "origin-[12px_12px] group-data-[active=true]/rhs-icon:rotate-90 group-data-[active=true]/rhs-icon:scale-50 group-data-[active=true]/rhs-icon:opacity-0",
        )}
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M18.7 5.3l-1.4 1.4"
      />
      <path
        className={cn(
          STATE_PART,
          "origin-[12px_12px] -rotate-90 scale-50 opacity-0 group-data-[active=true]/rhs-icon:rotate-0 group-data-[active=true]/rhs-icon:scale-100 group-data-[active=true]/rhs-icon:opacity-100",
        )}
        d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
      />
    </StateGlyph>
  );
}
