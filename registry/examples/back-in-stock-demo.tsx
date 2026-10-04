"use client";

import { BackInStock } from "@rhs-ui/commerce/back-in-stock";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-sm p-8">
      <BackInStock product="the Linen apron in Stone, size M" expected="Expected around 22 April" onSubscribe={() => new Promise<void>((resolve) => setTimeout(resolve, 600))} />
    </div>
  );
}
