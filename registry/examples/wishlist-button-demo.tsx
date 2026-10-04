"use client";

import { useState } from "react";

import { WishlistButton } from "@rhs-ui/commerce/wishlist-button";

export default function Demo(): React.JSX.Element {
  const [icon, setIcon] = useState(false);
  const [label, setLabel] = useState(true);
  return (
    <div className="mx-auto flex max-w-md items-center justify-center gap-6 p-10">
      <WishlistButton product="Linen apron" saved={icon} onSavedChange={setIcon} />
      <WishlistButton product="Stoneware mug" variant="label" saved={label} onSavedChange={setLabel} />
    </div>
  );
}
