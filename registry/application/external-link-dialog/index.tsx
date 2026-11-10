"use client";

import { cloneElement, useLayoutEffect, useRef, useState, type MouseEvent, type ReactElement, type ReactNode } from "react";

import { analyseLink, isScriptLink, isTrusted, type ExternalLinkLabels } from "@rhs-ui/application/external-link-dialog/link";
import { ExternalLinkPanel } from "@rhs-ui/application/external-link-dialog/panel";
import { AlertDialog, AlertDialogContent } from "@rhs-ui/primitives/alert-dialog";
import { cn } from "@/lib/utils";

export type { LinkInfo, ExternalLinkLabels } from "@rhs-ui/application/external-link-dialog/link";
export { ExternalLinkPanel, type ExternalLinkPanelProps } from "@rhs-ui/application/external-link-dialog/panel";

export interface ExternalLinkDialogProps {
  /** Where the link goes. Give it together with `trigger` (or with `open`, to ask without a trigger). Leave it out with `intercept`: the address is read from the link that was clicked. */
  href?: string;
  /** The element that asks the question when it is clicked: usually a link, `<a href={href}>`, or a button. A plain click is caught; a click with Ctrl, Cmd, Shift or the middle button goes through, because the browser then shows the address itself. */
  trigger?: ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>;
  /** Wrap content instead of one trigger: a click on any link inside it that leaves your site asks first. Links on your own site, `mailto:` and `tel:` links, and hosts in `trustedHosts` pass straight through, and a `javascript:` or `data:` link is stopped. */
  intercept?: boolean;
  /** The content to watch in `intercept` mode: a comment, a bio, a message. */
  children?: ReactNode;
  /** Hosts that skip the dialog: `docs.northwind.dev` matches exactly, `*.northwind.dev` matches every subdomain. A link to one of them just works. */
  trustedHosts?: readonly string[];
  /** Continue was chosen, with the address that opens. It opens in a new tab with `noopener noreferrer` either way; this is for counting it. */
  onContinue?: (href: string) => void;
  /** Go back was chosen, or Escape was pressed. */
  onCancel?: () => void;
  /** Adds "Don't ask again for this site" and calls this with the host when Continue is chosen with the box ticked. Store it however you like, and pass it back in `trustedHosts`. */
  onTrust?: (host: string) => void;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The words the dialog says, for translation. */
  labels?: ExternalLinkLabels;
  /** Classes for the wrapper in `intercept` mode, which has no box of its own unless you give it one. */
  className?: string;
}

const isPlainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * The pause before leaving your site through a link somebody else wrote: in comments, bios and messages the destination is
 * not yours. It shows where the link really goes with the host in bold, says "This link goes to another website", and
 * offers Continue or Go back, with Go back in focus. A host with look-alike letters is shown in its ASCII form under a
 * warning. Give it a `trigger` and an `href` for one link, or wrap the content with `intercept` and every outside link in it
 * asks. `trustedHosts` skip the dialog, and "Don't ask again for this site" calls `onTrust` so you decide how to store it. When it
 * closes, focus goes back to the link or button that was clicked, and it never grows taller than the screen: it scrolls.
 */
export function ExternalLinkDialog({ href, trigger, intercept = false, children, trustedHosts = [], onContinue, onCancel, onTrust, open, defaultOpen = false, onOpenChange, labels, className }: ExternalLinkDialogProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [asked, setAsked] = useState<string | null>(null);
  const continued = useRef(false);
  const returnTo = useRef<HTMLElement | SVGElement | null>(null);
  const isOpen = open ?? ownOpen;
  const target = intercept ? asked : (href ?? asked);
  const shown = isOpen && target !== null;

  // A dialog that is opened from the outside (`open`) was not asked by a click here: it remembers who had focus, before it takes focus into itself.
  useLayoutEffect(() => {
    if (!shown || returnTo.current) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) returnTo.current = active;
  }, [shown]);

  function change(next: boolean) {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
    if (next) return;
    // Continue closes the dialog too; only the other ways out are a "no".
    if (!continued.current) onCancel?.();
    continued.current = false;
  }

  /** Opens the question for an address. `from` is the link or button that was clicked: focus goes back to it when the dialog closes. */
  function ask(address: string, from: HTMLElement | SVGElement | null) {
    returnTo.current = from;
    setAsked(address);
    change(true);
  }

  function clickedTrigger(event: MouseEvent<HTMLElement>) {
    trigger?.props.onClick?.(event);
    if (event.defaultPrevented || !isPlainClick(event) || href === undefined) return;
    const info = analyseLink(href);
    if (!info) return;
    if (isTrusted(info.host, trustedHosts)) {
      // A link opens itself. A button that stands for one has to do it by hand.
      if (!event.currentTarget.closest("a[href]")) {
        onContinue?.(info.href);
        window.open(info.href, "_blank", "noopener,noreferrer");
      }
      return;
    }
    event.preventDefault();
    ask(href, event.currentTarget);
  }

  function clickedInside(event: MouseEvent<HTMLElement>) {
    const anchor = (event.target as Element | null)?.closest?.("a[href]");
    if (!anchor || !event.currentTarget.contains(anchor) || event.defaultPrevented || !isPlainClick(event)) return;
    // The attribute, not anchor.href: the property is already the ASCII form, and the written form is what shows a look-alike.
    const raw = (anchor.getAttribute("href") ?? "").trim();
    if (isScriptLink(raw)) {
      event.preventDefault();
      return;
    }
    const written = raw.startsWith("//") ? `${window.location.protocol}${raw}` : raw;
    const info = analyseLink(written);
    if (!info) return;
    if (new URL(info.href).origin === window.location.origin || isTrusted(info.host, trustedHosts)) return;
    event.preventDefault();
    ask(written, anchor instanceof HTMLElement || anchor instanceof SVGElement ? anchor : null);
  }

  return (
    <>
      {intercept ? (
        <div data-slot="external-link-dialog" className={cn("contents", className)} onClick={clickedInside}>
          {children}
        </div>
      ) : trigger ? (
        cloneElement(trigger, { onClick: clickedTrigger })
      ) : null}
      <AlertDialog open={shown} onOpenChange={change}>
        {target !== null ? (
          <AlertDialogContent
            // The dialog is never taller than the screen and scrolls when it has to (a phone on its side, larger text, a warning or two), so Go back and Continue are always reachable. `fixed` is what the primitive already sets.
            className="fixed max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-md"
            // There is no trigger inside the dialog to give focus back to: it goes to the link or button that was clicked, if it is still on the page.
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              const back = returnTo.current;
              returnTo.current = null;
              if (back?.isConnected) back.focus({ preventScroll: true });
            }}
          >
            <ExternalLinkPanel
              href={target}
              labels={labels}
              onTrust={onTrust}
              onContinue={(address) => {
                continued.current = true;
                onContinue?.(address);
              }}
            />
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </>
  );
}
