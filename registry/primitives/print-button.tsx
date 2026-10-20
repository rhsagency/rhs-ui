"use client";

import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import { IconPrinter } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";

export interface PrintButtonProps extends Omit<ComponentProps<"button">, "onClick" | "children" | "title"> {
  /** What to print: a ref to the element, or a selector for it. Leave it out to print the whole page. */
  target?: RefObject<HTMLElement | null> | string;
  /** The document title while printing, so the PDF gets a good file name: "Invoice INV-2041". */
  title?: string;
  /** Runs before the page is prepared. If it returns a promise, printing waits for it (to load a chart, say). */
  onBeforePrint?: () => void | Promise<void>;
  /** Runs once the print dialog is done and the page is back to normal. */
  onAfterPrint?: () => void;
  /** The words on the button. */
  label?: string;
  /** Any Button variant. */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
}

const ATTRIBUTE = "data-rhs-print";

/*
 * Applies only while a print job runs, and only in the print medium. The target
 * and every ancestor are marked; everything else is taken out of the layout, so
 * no blank pages are left behind. The ancestors are flattened to plain blocks,
 * or a sidebar grid would squeeze the target into one column.
 */
const PRINT_CSS = `
@page { margin: 14mm; }
@media print {
  html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; }
  body :not([${ATTRIBUTE}]):not([${ATTRIBUTE}="target"] *) { display: none !important; }
  [${ATTRIBUTE}="path"] { display: block !important; position: static !important; width: auto !important; height: auto !important; min-height: 0 !important; max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; overflow: visible !important; transform: none !important; background: none !important; box-shadow: none !important; }
  [${ATTRIBUTE}="target"] { margin: 0 !important; max-width: none !important; width: 100% !important; }
  [${ATTRIBUTE}="target"], [${ATTRIBUTE}="target"] * { color: #111 !important; background-color: transparent !important; box-shadow: none !important; text-shadow: none !important; animation: none !important; transition: none !important; }
  [${ATTRIBUTE}="target"] a { text-decoration: underline !important; }
  [${ATTRIBUTE}="target"] [data-print-hide] { display: none !important; }
}`;

/** Some in-app browsers and web views have no print dialog: window.print() exists there and does nothing. */
function canPrint(): boolean {
  if (typeof window.print !== "function") return false;
  const agent = navigator.userAgent;
  if (/; wv\)|FBAN|FBAV|Instagram|MicroMessenger|Line\//i.test(agent)) return false;
  // iOS web views leave "Safari/" out of the user agent; Safari and the other iOS browsers keep it.
  return !(/iPhone|iPad|iPod/.test(agent) && !/Safari\//.test(agent));
}

/**
 * Prints one part of the page instead of the whole thing. It marks the target,
 * injects a print stylesheet that takes everything else out of the layout,
 * drops shadows and the dark theme and keeps links readable, then restores the
 * title and the page when the browser reports `afterprint`. Anything inside the
 * target marked `data-print-hide` (its own buttons, say) stays off the paper.
 * It renders nothing where printing is not available, and it never prints
 * during server render.
 */
export function PrintButton({ target, title, onBeforePrint, onAfterPrint, label = "Print", variant = "outline", size, ...props }: PrintButtonProps) {
  const [available, setAvailable] = useState(true);
  const finish = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!canPrint()) setAvailable(false);
    return () => finish.current?.();
  }, []);
  if (!available) return null;

  async function print() {
    finish.current?.();
    await onBeforePrint?.();
    const root = typeof target === "string" ? document.querySelector<HTMLElement>(target) : (target?.current ?? null);
    const marked: Element[] = [];
    let sheet: HTMLStyleElement | null = null;
    if (root) {
      for (let node: Element | null = root; node; node = node.parentElement) {
        node.setAttribute(ATTRIBUTE, node === root ? "target" : "path");
        marked.push(node);
      }
      sheet = document.createElement("style");
      sheet.setAttribute("data-rhs-print-style", "");
      sheet.textContent = PRINT_CSS;
      document.head.append(sheet);
    }
    const before = document.title;
    if (title) document.title = title;
    let done = false;
    const restore = () => {
      if (done) return;
      done = true;
      window.removeEventListener("afterprint", restore);
      marked.forEach((node) => node.removeAttribute(ATTRIBUTE));
      sheet?.remove();
      document.title = before;
      finish.current = null;
      onAfterPrint?.();
    };
    finish.current = restore;
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return (
    <Button data-slot="print-button" type="button" variant={variant} size={size} onClick={() => void print()} {...props}>
      <IconPrinter />
      {label}
    </Button>
  );
}
