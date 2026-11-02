"use client";

import { useState, type ReactNode } from "react";

import { CardFieldset, type CardFieldsetState, type CardFieldsetValue } from "@rhs-ui/commerce/card-fieldset";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      {/* Three lines tall in a two-column row, so the fields line up across the columns. */}
      <p className="text-xs leading-relaxed text-muted-foreground sm:min-h-12">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [state, setState] = useState<CardFieldsetState>({ brand: null, valid: false });
  const [value, setValue] = useState<CardFieldsetValue | null>(null);

  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-12 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="Try 4242 4242 4242 4242. The spacing follows the card, the brand is named in words, and the focus moves on once a part is complete.">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <CardFieldset
            showName
            onChange={(next, nextState) => {
              setValue(next);
              setState(nextState);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Reports{" "}
            {/* A space after each comma, so a narrow screen breaks the line there and nowhere else. */}
            <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground tabular-nums [overflow-wrap:anywhere]">{JSON.stringify(state).replace(/,/g, ", ")}</code>
            {value ? <span className="ml-1.5 tabular-nums">{value.number.length} digits</span> : null}
          </p>
        </div>
      </Example>

      <Example caption="A card that passes every check, with the brand found from its first digit.">
        <CardFieldset defaultValue={{ number: "4242424242424242", expiry: "1230", code: "123", name: "Mara Jansen" }} showName />
      </Example>

      <Example caption="Each message is tied to its own input: a number that fails the Luhn check, an expiry in the past and a code that is too short.">
        <CardFieldset showErrors defaultValue={{ number: "4242424242424241", expiry: "0120", code: "12" }} />
      </Example>

      <Example caption="American Express: 4-6-5 spacing, fifteen digits and a code of four.">
        <CardFieldset defaultValue={{ number: "378282246310005", expiry: "0929", code: "1234" }} />
      </Example>

      <Example caption="Your processor's hosted fields in the same frame: renderField replaces the number and the code, the expiry stays built in.">
        <CardFieldset
          renderField={(part, field) =>
            part === "expiry" ? undefined : (
              <input id={field.id} readOnly placeholder={part === "number" ? "Hosted card number" : "Hosted code"} disabled={field.disabled} aria-describedby={field["aria-describedby"]} className={field.className} />
            )
          }
        />
      </Example>

      <Example caption="Disabled while a payment is processing: the whole frame dims, and no field takes the focus.">
        <CardFieldset disabled showName defaultValue={{ number: "5555555555554444", expiry: "0828", code: "737", name: "Tessa de Vries" }} />
      </Example>
    </div>
  );
}
