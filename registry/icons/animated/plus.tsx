import { StateGlyph, STATE_PART, type StateIconProps } from "@rhs-ui/icons/state-icon";
import { cn } from "@/lib/utils";

/** Plus turns a eighth of a turn into a close. Set `active` while the thing it opened is open. */
const ARM = "origin-[12px_12px] group-data-[active=true]/rhs-icon:rotate-45";

export function IconPlusAnimated(props: StateIconProps) {
  return (
    <StateGlyph {...props}>
      <path className={cn(STATE_PART, ARM)} d="M12 5v14" />
      <path className={cn(STATE_PART, ARM)} d="M5 12h14" />
    </StateGlyph>
  );
}
