"use client";

import { useState, type ReactElement, type ReactNode } from "react";

import { IconClose } from "@rhs-ui/icons";
import type { EmbedControl, EmbedLabels, EmbedSettings } from "@rhs-ui/application/embed-dialog/snippet";
import { EmbedPanel } from "@rhs-ui/application/embed-dialog/panel";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export type { EmbedControl, EmbedLabels, EmbedSettings, EmbedTheme } from "@rhs-ui/application/embed-dialog/snippet";
export { EmbedPanel, type EmbedPanelProps } from "@rhs-ui/application/embed-dialog/panel";

export interface EmbedDialogProps {
  /** Writes the code for the settings, as a string: an iframe, a script tag, whatever you embed with. It runs again each time something changes. Escape every value that goes into an attribute with `escapeAttribute`, or start from `iframeSnippet`. */
  buildSnippet: (settings: EmbedSettings) => string;
  /** What the settings start as. Default 640 by 360 pixels, light, not responsive. */
  defaults?: Partial<EmbedSettings>;
  /** Which options to show: "width", "height", "theme" and "responsive". Leave one out and the person cannot change it. Default all four. */
  controls?: readonly EmbedControl[];
  /** A page to show in the preview, in a sandboxed frame sized like the embed. A function of the settings can put the theme in the address. Leave it out, and `preview`, for no preview. */
  previewUrl?: string | ((settings: EmbedSettings) => string);
  /** The page in `previewUrl` is yours, so it may keep its own origin (its storage and cookies). Without this the frame is sandboxed with scripts but without `allow-same-origin`, which is what keeps a page on your own origin from lifting its sandbox. Default false. */
  trustedPreview?: boolean;
  /** Draws the preview yourself, from the settings, when a frame is not an option: a mock, or the component itself. It takes the place of `previewUrl`. */
  preview?: (settings: EmbedSettings) => ReactNode;
  /** What the preview frame is, for screen readers. Default "Preview". */
  previewTitle?: string;
  /** The code was copied, with the code. */
  onCopy?: (snippet: string) => void;
  /** Called with all the settings each time one of them changes. */
  onSettingsChange?: (settings: EmbedSettings) => void;
  /** The element that opens the dialog, usually a Button. Focus returns to it when the dialog closes. */
  trigger?: ReactElement;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The language the sizes are written in. Default "en-US". */
  locale?: string;
  /** The words the dialog says, for translation. */
  labels?: EmbedLabels;
  /** Classes for the dialog panel, for a different width. */
  className?: string;
}

/**
 * Let people embed your content. Width and height are number fields with a unit, Responsive switches the code to a
 * full-width wrapper that keeps the shape, and Theme is a segmented control; the code updates as they choose, with a copy
 * button beside it that confirms and is announced; the code keeps its own lines and scrolls sideways when one is too long. An
 * optional preview draws the same settings in a frame of the same size, labelled, so people see what they will get. `buildSnippet` returns the code, and `escapeAttribute` and `iframeSnippet` are
 * there so a value with a quote or an ampersand in it cannot break out of its attribute.
 */
export function EmbedDialog({
  buildSnippet,
  defaults,
  controls,
  previewUrl,
  trustedPreview,
  preview,
  previewTitle,
  onCopy,
  onSettingsChange,
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  locale,
  labels,
  className,
}: EmbedDialogProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;

  function change(next: boolean) {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        data-slot="embed-dialog"
        showCloseButton={false}
        // With a preview the options sit beside it, which wants room; without one the dialog stays narrow.
        className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0", preview !== undefined || previewUrl !== undefined ? "sm:max-w-3xl" : "sm:max-w-lg", className)}
      >
        <EmbedPanel
          buildSnippet={buildSnippet}
          defaults={defaults}
          controls={controls}
          previewUrl={previewUrl}
          trustedPreview={trustedPreview}
          preview={preview}
          previewTitle={previewTitle}
          onCopy={onCopy}
          onSettingsChange={onSettingsChange}
          locale={locale}
          labels={labels}
        />
        <DialogClose asChild>
          <button
            type="button"
            aria-label={labels?.closeIcon ?? "Close"}
            // Level with the title: the header starts 8px lower from sm up (sm:pt-6), and the button goes down with it.
            className="absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:top-[1.3125rem]"
          >
            <IconClose size={16} />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
