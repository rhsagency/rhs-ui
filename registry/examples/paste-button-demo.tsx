"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconCheck, IconCopy } from "@rhs-ui/icons";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { PasteButton } from "@rhs-ui/primitives/paste-button";

/** IBAN check: the country code and check digits, then the mod 97 rule. */
function validIban(text: string): boolean {
  const iban = text.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

const ibanReason = (text: string) => (validIban(text) ? undefined : "That is not a valid IBAN: check the country code and the two check digits.");

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Puts a sample on the real clipboard, so the paste button can be tried end to end. */
function SampleCopy({ text, label }: { text: string; label: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1800);
        } catch {
          /* Not allowed here: the paste button still explains itself. */
        }
      }}
      className="inline-flex w-fit items-center gap-1.5 rounded-md py-0.5 pr-1 text-xs font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      {copied ? <IconCheck className="size-3.5" /> : <IconCopy className="size-3.5" />}
      {copied ? "Copied to the clipboard" : label}
    </button>
  );
}

const OUTCOMES = [
  { value: "pasted", label: "Pasted" },
  { value: "refused", label: "Refused" },
  { value: "empty", label: "Empty" },
  { value: "blocked", label: "Blocked" },
] as const;

type Outcome = (typeof OUTCOMES)[number]["value"];

/** A simulated clipboard for each way a paste can end. */
const READERS: Record<Outcome, () => Promise<string>> = {
  pasted: async () => "NL91 ABNA 0417 1643 00",
  refused: async () => "https://northwind.app/s/k7xq2m",
  empty: async () => "  \n ",
  blocked: async () => {
    throw new DOMException("Read permission denied.", "NotAllowedError");
  },
};

/** Choosing an outcome presses the button for you, so its message opens at once. */
function Outcomes(): React.JSX.Element {
  const [outcome, setOutcome] = useState<Outcome>("refused");
  const box = useRef<HTMLDivElement>(null);
  const chosen = useRef(false);
  useEffect(() => {
    // On load, only press for them when the message will land in view; after that they are looking at it.
    const room = box.current ? box.current.getBoundingClientRect().bottom + 120 < window.innerHeight : false;
    if (!chosen.current && !room) return;
    const timer = window.setTimeout(() => box.current?.querySelector("button")?.click(), 120);
    return () => window.clearTimeout(timer);
  }, [outcome]);
  return (
    <div className="grid gap-4">
      {/* Two by two on a phone, where four segments in a row would run off the edge. */}
      <SegmentedControl
        className="grid w-full grid-cols-2 sm:inline-flex sm:w-fit"
        label="Outcome"
        value={outcome}
        onValueChange={(value) => {
          chosen.current = true;
          setOutcome(value as Outcome);
        }}
        options={OUTCOMES}
      />
      <div ref={box} className="min-h-40">
        <PasteButton key={outcome} align="start" label="Paste IBAN" read={READERS[outcome]} validate={ibanReason} />
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const code = useRef<HTMLInputElement>(null);
  const iban = useRef<HTMLInputElement>(null);
  const link = useRef<HTMLInputElement>(null);

  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="One press reads the clipboard (the browser may ask first), checks the text and fills the field. The field's own maxLength is the limit.">
        <div className="grid gap-2">
          <Label htmlFor="paste-code">Verification code</Label>
          <div className="flex gap-2">
            <Input id="paste-code" ref={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 digits" className="font-mono tracking-[0.2em] tabular-nums" />
            <PasteButton targetRef={code} label="Paste code" validate={(text) => (/^\d{6}$/.test(text) ? undefined : "A code is exactly six digits.")} />
          </div>
          <SampleCopy text="482915" label="Copy a sample code, then press Paste" />
        </div>
      </Example>

      <Example caption="With your own check: an IBAN, spaces and all, is verified before it lands in the field">
        <div className="grid gap-2">
          <Label htmlFor="paste-iban">IBAN</Label>
          <div className="flex gap-2">
            <Input id="paste-iban" ref={iban} maxLength={42} placeholder="NL00 BANK 0000 0000 00" className="font-mono" spellCheck={false} />
            <PasteButton targetRef={iban} label="Paste IBAN" validate={ibanReason} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <SampleCopy text="NL91 ABNA 0417 1643 00" label="Copy a valid IBAN" />
            <SampleCopy text="NL91 ABNA 0417 1643 01" label="Copy one with a wrong check digit" />
          </div>
        </div>
      </Example>

      <Example caption="Smaller and quieter, inside a card of settings">
        <div className="grid gap-2 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xs">
          <Label htmlFor="paste-link">Meeting link</Label>
          <div className="flex items-center gap-2">
            <Input id="paste-link" ref={link} type="url" placeholder="https://" className="h-8 text-[0.8125rem]" />
            <PasteButton targetRef={link} size="sm" variant="secondary" label="Paste link" validate={(text) => (/^https?:\/\/\S+$/i.test(text) ? undefined : "That does not look like a link: it should start with https://.")} />
          </div>
        </div>
      </Example>

      <Example caption="Try each way it can end, with a simulated clipboard: choosing one presses the button for you">
        <Outcomes />
      </Example>
    </div>
  );
}
