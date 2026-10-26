"use client";

import { useState, type ReactNode } from "react";

import { IconMailbox, IconUserCheck } from "@rhs-ui/icons";
import { DeliveryInstructions, type DeliveryInstructionsValue, type DeliveryOption } from "@rhs-ui/commerce/delivery-instructions";

/** A shop that offers two ways to receive the parcel: only the cards it passes are drawn. */
const TWO_WAYS: readonly DeliveryOption[] = [
  { value: "hand", title: "Hand it to me", description: "Someone has to be home, so nothing is left outside.", flag: "Safest", icon: <IconUserCheck />, fields: ["phone", "note"] },
  { value: "locker", title: "Use a parcel locker", description: "Collect it with a code within 3 days. Nobody has to be home.", icon: <IconMailbox />, fields: [] },
];

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<DeliveryInstructionsValue>({
    dropOff: "neighbour",
    neighbour: "14, Van Dijk (left of the green gate)",
    code: "4821",
    phone: "+31 6 5555 0142",
    note: "The bell is quiet, so knock twice. The parcel is fragile.",
    saveAsDefault: false,
  });
  return (
    <div className="mx-auto grid w-full max-w-2xl min-w-0 gap-14 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="Controlled: choosing a neighbour brings in their address, the gate code, a phone number and a note" note={`value.dropOff is "${value.dropOff}", and the code has ${value.code.length} characters.`}>
        <DeliveryInstructions value={value} onChange={setValue} locale="en-GB" />
      </Example>
      <Example caption="Left to itself, with no phone number asked for and a shorter note">
        <DeliveryInstructions defaultValue={{ dropOff: "door" }} showPhone={false} noteLimit={120} locale="en-GB" />
      </Example>
      <Example caption="In a checkout drawer or a side column the cards stack, whatever the width of the screen; this shop offers two ways">
        <div className="max-w-sm min-w-0">
          <DeliveryInstructions options={TWO_WAYS} defaultValue={{ dropOff: "locker" }} locale="en-GB" />
        </div>
      </Example>
    </div>
  );
}
