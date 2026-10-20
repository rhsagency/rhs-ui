"use client";

import { useId, useState, type ReactNode } from "react";

import { CartIssues, type CartIssue } from "@rhs-ui/commerce/cart-issues";
import { summarizeCartIssues } from "@rhs-ui/commerce/cart-issues/issues";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const START: CartIssue[] = [
  { id: "shirt", type: "unavailable", line: "Linen shirt, M", message: "Sold out since you added it.", fix: "Remove" },
  { id: "scarf", type: "quantity", line: "Merino scarf, Ink", message: "You have 3 in your cart, but only 2 are left.", fix: "Update to 2" },
  { id: "mug", type: "price", line: "Stoneware mug", message: "The price went up from €18.00 to €20.00.", fix: "Accept new price" },
  { id: "minimum", type: "minimum", message: "Add €12.00 more to reach the €30.00 minimum order.", fix: "Keep shopping" },
];

const GOOD_NEWS: CartIssue[] = [{ id: "candle", type: "price", line: "Beeswax candle", message: "The price dropped from €26.00 to €22.00.", blocking: false }];

function Example({ caption, action, children }: { caption: string; action?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">{caption}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const reasonId = useId();
  const [issues, setIssues] = useState<CartIssue[]>(START);
  const [notices, setNotices] = useState<CartIssue[]>(GOOD_NEWS);
  const [ordered, setOrdered] = useState(false);
  const [shopNote, setShopNote] = useState<string | null>(null);
  const summary = summarizeCartIssues(issues);

  const remove = (ids: Set<string>) => setIssues((current) => current.filter((issue) => !ids.has(issue.id)));

  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example
        caption="Fix them one by one, or all at once. The minimum order is for the shopper to solve."
        action={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setIssues(START);
              setOrdered(false);
              setShopNote(null);
            }}
          >
            Reset
          </Button>
        }
      >
        <CartIssues
          id="cart-issues-demo"
          issues={issues}
          onFix={(issue) => {
            if (issue.type === "minimum") {
              // Keep shopping leaves for the shop. The minimum is only met when the cart holds enough, so the issue stays where it is.
              setShopNote("Keep shopping goes back to the shop. The minimum stays until the cart holds €30.00.");
              return;
            }
            return wait(600).then(() => remove(new Set([issue.id])));
          }}
          onFixAll={async (list) => {
            await wait(800);
            remove(new Set(list.map((issue) => issue.id)));
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-medium">Ready to check out?</p>
            <p id={reasonId} className="text-xs text-muted-foreground">
              {ordered ? "Order placed. This is a preview." : (summary.reason ?? "Everything in your cart is ready.")}
            </p>
          </div>
          <Button type="button" aria-disabled={summary.blocking > 0 || undefined} aria-describedby={reasonId} onClick={() => summary.blocking === 0 && setOrdered(true)} className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50">
            Check out
          </Button>
        </div>
        {shopNote ? (
          <p role="status" className="text-xs text-muted-foreground">
            {shopNote}
          </p>
        ) : null}
      </Example>

      <Example
        caption="Only good news: nothing blocks, and a notice can be dismissed"
        action={
          <Button type="button" size="sm" variant="ghost" onClick={() => setNotices(GOOD_NEWS)}>
            Reset
          </Button>
        }
      >
        {/* It stays mounted when the last notice is dismissed: the focus lands on its status line instead of falling back to the page. */}
        <CartIssues title="Good news about your cart" issues={notices} onDismiss={(issue) => setNotices((current) => current.filter((entry) => entry.id !== issue.id))} />
        {notices.length === 0 ? <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">All clear: nothing needs your attention.</p> : null}
      </Example>
    </div>
  );
}
