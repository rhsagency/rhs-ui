"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { Glyph, IconUserPlus } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { buildVCard, downloadTextFile, vCardFileName, type Contact } from "@rhs-ui/application/save-contact-button/vcard";
import { cn } from "@/lib/utils";

export interface SaveContactButtonProps extends Omit<ComponentProps<"div">, "children"> {
  /** The person or business: name, organisation, title, phones, emails, url, address, note, photoUrl. */
  contact: Contact;
  /** The name of the downloaded file. ".vcf" is added when it is missing. Default: the contact's name. */
  fileName?: string;
  /** The button's text. It says what happens. Default "Save to contacts". */
  label?: string;
  /** The text for the moment after the file has been handed over. Default "Downloaded". */
  doneLabel?: string;
  /** Called with the contact and the vCard text once the file has been handed to the browser. */
  onSave?: (contact: Contact, vcard: string) => void;
  /** Any Button variant. Default "outline". */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
}

const fade = "col-start-1 row-start-1 transition-opacity duration-200 motion-reduce:transition-none";
const draw = "transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none";
// The old words leave quickly and the new ones arrive just after, so the two are hardly ever on screen together.
const swap = "col-start-1 row-start-1 truncate transition-[opacity,translate] motion-reduce:transition-none";

/**
 * A button that saves a person or a business to the address book. It builds a
 * vCard 3.0 file in the browser from one contact object (escaped text, folded
 * lines, labelled phone and email types) and hands it over as a download, with
 * no server involved; on an iPhone the file opens the Add Contact sheet. The
 * label says what happens, the accessible name adds who ("Save to contacts,
 * Maya Okafor"), and a contact with no name disables the button and says why.
 * The pure buildVCard function is exported from vcard.ts, for testing or for
 * turning the same card into a QR code.
 */
export function SaveContactButton({ contact, fileName, label = "Save to contacts", doneLabel = "Downloaded", onSave, variant = "outline", size, className, ...props }: SaveContactButtonProps) {
  const reasonId = useId();
  const [done, setDone] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const name = contact.name?.trim() ?? "";
  const ready = name.length > 0;

  function save() {
    const card = buildVCard(contact);
    if (!card) return;
    downloadTextFile(card, vCardFileName(contact, fileName), "text/vcard;charset=utf-8");
    window.clearTimeout(timer.current);
    setDone(true);
    timer.current = window.setTimeout(() => setDone(false), 2600);
    onSave?.(contact, card);
  }

  return (
    <div data-slot="save-contact-button" className={cn("inline-flex max-w-full flex-col items-start gap-1.5", className)} {...props}>
      <span role="status" className="sr-only">
        {done ? `${name}'s contact card was downloaded.` : ""}
      </span>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={!ready}
        aria-describedby={ready ? undefined : reasonId}
        data-status={done ? "done" : "idle"}
        className="max-w-full"
        onClick={save}
      >
        <span className="relative grid size-4 shrink-0 place-items-center">
          <IconUserPlus className={cn(fade, done ? "opacity-0" : "opacity-100")} />
          <Glyph className={cn(fade, done ? "opacity-100" : "opacity-0")}>
            <path d="M5 12.5l4.5 4.5L19 7" pathLength={1} strokeDasharray={1} className={cn(draw, "delay-100", done ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
          </Glyph>
        </span>
        <span className="inline-grid min-w-0 text-start">
          <span aria-hidden={done || undefined} className={cn(swap, done ? "pointer-events-none -translate-y-1 opacity-0 duration-100" : "opacity-100 delay-75 duration-200")}>
            {label}
            {ready ? <span className="sr-only">, {name}</span> : null}
          </span>
          <span aria-hidden={done ? undefined : true} className={cn(swap, done ? "opacity-100 delay-75 duration-200" : "pointer-events-none translate-y-1 opacity-0 duration-100")}>
            {doneLabel}
            {ready ? <span className="sr-only">, {name}</span> : null}
          </span>
        </span>
      </Button>
      {ready ? null : (
        <p id={reasonId} className="text-xs text-muted-foreground">
          Add a name to save this contact.
        </p>
      )}
    </div>
  );
}
