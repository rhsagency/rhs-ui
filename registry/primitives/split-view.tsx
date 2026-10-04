import type { ReactNode } from "react";

import { IconArrowLeft } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface SplitViewProps {
  /** The list: inbox, contacts, orders. */
  list: ReactNode;
  /** The selected item, or null for none. */
  detail: ReactNode | null;
  /** Shown in the detail pane when nothing is selected (wide screens). */
  empty?: ReactNode;
  /** Back from the detail to the list on a phone. */
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

/**
 * The list-and-detail layout of mail, chat and admin apps: side by side on
 * wide screens, and on a phone one at a time, the detail with a back button
 * when something is selected. Both panes scroll on their own. You keep the
 * selection (in the URL, ideally), the layout follows it.
 */
export function SplitView({ list, detail, empty, onBack, backLabel = "Back", className }: SplitViewProps) {
  const selected = detail !== null;
  return (
    <div data-slot="split-view" className={cn("grid h-full min-h-0 md:grid-cols-[minmax(16rem,22rem)_1fr]", className)}>
      <div className={cn("relative min-h-0 overflow-y-auto border-border md:block md:border-r", selected && "hidden")}>{list}</div>
      <div className={cn("relative min-h-0 overflow-y-auto", !selected && "hidden md:block")}>
        {selected ? (
          <>
            {onBack ? <button type="button" onClick={onBack} className="m-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 md:hidden [&_svg]:size-4"><IconArrowLeft aria-hidden="true" />{backLabel}</button> : null}
            {detail}
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">{empty ?? "Select an item to see it here."}</div>
        )}
      </div>
    </div>
  );
}
