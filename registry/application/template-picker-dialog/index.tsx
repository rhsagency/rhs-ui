"use client";

import { useRef, useState, type ReactElement, type ReactNode } from "react";

import { IconClose } from "@rhs-ui/icons";
import { DEFAULT_LABELS, type Template, type TemplateCategory, type TemplatePickerLabels } from "@rhs-ui/application/template-picker-dialog/templates";
import { TemplatePickerPanel } from "@rhs-ui/application/template-picker-dialog/panel";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export type { Template, TemplateCategory, TemplatePickerLabels } from "@rhs-ui/application/template-picker-dialog/templates";
export { TemplatePickerPanel, type TemplatePickerPanelProps } from "@rhs-ui/application/template-picker-dialog/panel";

export interface TemplatePickerDialogProps {
  /** The templates to choose from: an id, a name, a description, a category, a preview and tags to search by. Blank is added for you, first. */
  templates: readonly Template[];
  /** The groups for the rail, with their names. Categories that templates name and you did not list are added after yours. */
  categories?: readonly TemplateCategory[];
  /** The `id` of the category to start in. Default: all templates. */
  defaultCategory?: string;
  /**
   * The choice was made: the `id` of the template, or null for Blank. Return a promise and the dialog locks while it runs
   * (it cannot be closed, the button spins) and closes when it resolves; when it rejects the dialog stays open and says why.
   */
  onSelect: (id: string | null) => void | Promise<void>;
  /** The element that opens the dialog, usually a Button. Focus returns to it when the dialog closes. */
  trigger?: ReactElement;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. A close that is refused while a choice is being made is not reported. */
  onOpenChange?: (open: boolean) => void;
  /** The language of the numbers and of "1 template" against "12 templates". Default "en-US". */
  locale?: string;
  /** The words the dialog says, for translation. */
  labels?: TemplatePickerLabels;
  /** The picture on the Blank card. It has a quiet one of its own. */
  blankPreview?: ReactNode;
  /** Classes for the dialog panel, for a different width. */
  className?: string;
}

/**
 * Start a document, a project or a page from a template. A dialog with a search field, the categories with counts, a
 * grid of cards that works as one radio group (arrow keys move across the grid, Enter makes it) and the template in focus
 * beside it with a larger preview and its description; below 640px that panel becomes a sheet at the foot. Blank is always
 * the first card and the default choice, and the button names what it will make ("Use Weekly report"). While a choice is
 * being made the dialog locks, and when it fails it stays open and says why. A search with no result says so and offers to
 * clear itself.
 */
export function TemplatePickerDialog({
  templates,
  categories,
  defaultCategory,
  onSelect,
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  locale,
  labels,
  blankPreview,
  className,
}: TemplatePickerDialogProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const busyNow = useRef(false);
  const content = useRef<HTMLDivElement>(null);
  const isOpen = open ?? ownOpen;

  function change(next: boolean) {
    // A choice that is being made cannot be walked away from.
    if (!next && busyNow.current) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        ref={content}
        data-slot="template-picker-dialog"
        showCloseButton={false}
        // Focus starts on the chosen card, so the arrow keys work at once and a phone is not made to raise its keyboard for the search field.
        onOpenAutoFocus={(event) => {
          const card = content.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]');
          if (!card) return;
          event.preventDefault();
          card.focus({ preventScroll: true });
        }}
        // A search with text takes Escape for itself and empties first; the dialog closes on the next one.
        onEscapeKeyDown={(event) => {
          if (busyNow.current || document.activeElement?.closest("[data-escape-local]")) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (busyNow.current) event.preventDefault();
        }}
        className={cn("flex h-[calc(100dvh-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:h-[min(44rem,calc(100dvh-2rem))] sm:max-w-5xl", className)}
      >
        <TemplatePickerPanel
          templates={templates}
          categories={categories}
          defaultCategory={defaultCategory}
          onSelect={onSelect}
          locale={locale}
          labels={labels}
          blankPreview={blankPreview}
          onClose={() => change(false)}
          onBusyChange={(next) => {
            busyNow.current = next;
            setBusy(next);
          }}
        />
        <DialogClose asChild>
          <button
            type="button"
            aria-disabled={busy || undefined}
            aria-label={words.close}
            className="absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-disabled:pointer-events-none aria-disabled:opacity-50 motion-reduce:transition-none"
          >
            <IconClose size={16} />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
