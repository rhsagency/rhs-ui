"use client";

import { useState } from "react";

import { SortMenu } from "@rhs-ui/commerce/sort-menu";

export default function Demo(): React.JSX.Element {
  const [sort, setSort] = useState("featured");
  return (
    <div className="mx-auto flex min-h-64 max-w-md items-start justify-between gap-4 p-8 text-sm">
      <span className="pt-2 text-muted-foreground">48 products</span>
      <SortMenu value={sort} onValueChange={setSort} options={[{ value: "featured", label: "Featured" }, { value: "new", label: "Newest" }, { value: "price-asc", label: "Price, low to high" }, { value: "price-desc", label: "Price, high to low" }, { value: "rating", label: "Best rated" }]} />
    </div>
  );
}
