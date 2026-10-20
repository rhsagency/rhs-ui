"use client";

import { useRef, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { AddToCartButton } from "@rhs-ui/commerce/add-to-cart-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const EUR = (amount: number) => ({ amount, currency: "EUR" });

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A product with a size to pick: until it is picked the button says so, and a press hands focus to the sizes. */
function WithSize(): React.JSX.Element {
  const [size, setSize] = useState("");
  const sizes = useRef<HTMLDivElement>(null);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div ref={sizes} className="grid gap-2">
        <p className="text-sm font-medium">Size</p>
        <SegmentedControl label="Size" value={size} onValueChange={setSize} options={["XS", "S", "M", "L"].map((value) => ({ value, label: value }))} className="w-full [&>button]:flex-1" />
      </div>
      <AddToCartButton
        price={EUR(6200)}
        locale="en-GB"
        cartHref="#cart"
        missingOption={size ? undefined : { label: "Select a size", onFocusOption: () => sizes.current?.querySelector<HTMLElement>('[role="radio"]')?.focus() }}
        onAdd={() => wait(900)}
      />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const attempts = useRef(0);
  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
      <Example caption="Press it: adding, then Added beside View cart">
        <AddToCartButton price={EUR(5400)} locale="en-GB" cartHref="#cart" onAdd={() => wait(1100)} />
      </Example>

      <Example caption="Fails the first time: the inline error is the retry">
        <AddToCartButton
          price={EUR(12900)}
          locale="en-GB"
          cartHref="#cart"
          onAdd={async () => {
            attempts.current += 1;
            await wait(1000);
            if (attempts.current % 2 === 1) throw new Error("The cart did not answer.");
          }}
        />
      </Example>

      <Example caption="An option is missing: the button says which, and takes you to it">
        <WithSize />
      </Example>

      <Example caption="Sold out, with a way to be told when it is back">
        <AddToCartButton soldOut cartHref="#cart" onNotify={() => wait(800)} />
      </Example>

      <Example caption="A pre-order: the ship date sits under the button">
        <AddToCartButton price={EUR(24900)} locale="en-GB" cartHref="#cart" preorder={{ shipsOn: "12 March" }} onAdd={() => wait(900)} />
      </Example>

      <Example caption="Sold out, nothing to do">
        <AddToCartButton soldOut cartHref="#cart" />
      </Example>

      <div className="col-span-full grid min-w-0 gap-3">
        <p className="text-xs text-muted-foreground">Every state of a purchase, driven from outside with status={"{mutation.status}"}</p>
        <div className="grid gap-x-8 gap-y-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
          {(["adding", "added", "failed"] as const).map((status) => (
            <div key={status} className="grid min-w-0 gap-2">
              <AddToCartButton status={status} price={EUR(5400)} locale="en-GB" cartHref="#cart" />
              <span className="text-xs text-muted-foreground capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
