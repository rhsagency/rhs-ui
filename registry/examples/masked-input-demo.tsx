"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Label } from "@rhs-ui/primitives/label";
import { MaskedInput, type MaskedInputProps } from "@rhs-ui/primitives/masked-input";
import { cleanRaw, maskCapacity, parseMask, type MaskDefinitions } from "@rhs-ui/primitives/masked-input/mask";

/** A hexadecimal digit, written in capitals: the token H for the MAC address below. */
const HEX: MaskDefinitions = { H: { pattern: /[0-9a-f]/i, transform: (char: string) => char.toUpperCase() } };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A masked field with its label and a line that shows what it reports: the bare characters, and how many of the places are filled. */
function Mask({ label, ...props }: Omit<MaskedInputProps, "id"> & { label: string }): React.JSX.Element {
  const id = useId();
  const slots = useMemo(() => parseMask(props.mask, props.definitions), [props.mask, props.definitions]);
  const total = maskCapacity(slots);
  const [raw, setRaw] = useState(() => cleanRaw(props.defaultValue ?? "", slots));
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <MaskedInput id={id} {...props} onValueChange={(next) => setRaw(next)} />
      <p className="flex items-center justify-between gap-3 text-xs text-muted-foreground" aria-live="polite">
        <span className="min-w-0">
          Value <code className="font-mono text-[0.6875rem] break-all text-foreground">{raw ? JSON.stringify(raw) : "empty"}</code>
        </span>
        <span className="flex shrink-0 items-center gap-1 tabular-nums">
          {raw.length === total ? <IconCheck size={13} strokeWidth={2.5} aria-hidden="true" className="text-foreground" /> : null}
          {raw.length === total ? <span className="font-medium text-foreground">Complete</span> : `${raw.length} of ${total}`}
        </span>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2">
      <Example caption="Literals are written for you; the quiet text shows what is left">
        <Mask label="Phone number" mask="(###) ###-####" showMask defaultValue="555012" />
      </Example>
      <Example caption="Letters become capitals, and a digit is refused where one belongs">
        <Mask label="Postcode" mask="#### AA" showMask defaultValue="1017a" />
      </Example>
      <Example caption="Empty: the ghost mask is the placeholder, prefix included">
        <Mask label="Order reference" mask="NW-########" showMask />
      </Example>
      <Example caption="Full: the value is the bare characters, not the shape">
        <Mask label="Number plate" mask="AA-###-A" showMask defaultValue="kt482b" />
      </Example>
      <Example caption="A token of your own: H is a hexadecimal digit">
        <Mask label="MAC address" mask="HH:HH:HH:HH:HH:HH" definitions={HEX} showMask defaultValue="00:1a:2b" />
      </Example>
      <Example caption="No ghost, a plain placeholder. Paste in the middle: the caret stays">
        <Mask label="Card number" mask="#### #### #### ####" placeholder="1234 5678 9012 3456" defaultValue="4242424242" />
      </Example>
    </div>
  );
}
