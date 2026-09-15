import type { ReactNode } from "react";

import { Glyph, type IconProps } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/**
 * The frame for icons that change between two states: copy into check, menu
 * into close, sun into moon. Pure CSS, so these icons render in a Server
 * Component. Parts read `data-active` from this svg through the
 * `group-data-[active=true]/rhs-icon:` variant and share one transition.
 * The state itself belongs on the control around the icon (`aria-pressed`,
 * `aria-expanded` or a changing label); the icon only shows it.
 */
export interface StateIconProps extends IconProps {
  /** The second state. */
  active?: boolean;
}

export function StateGlyph({ active = false, className, children, ...props }: StateIconProps & { children: ReactNode }) {
  return (
    <Glyph {...props} data-active={active} className={cn("group/rhs-icon", className)}>
      {children}
    </Glyph>
  );
}

/** The transition every part of a state icon shares. Reduced motion switches at once. */
export const STATE_PART =
  "transition-[opacity,scale,rotate,translate,stroke-dashoffset] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none";
