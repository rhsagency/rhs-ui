"use client";

import { useState } from "react";

import { PageSizePagination } from "@rhs-ui/primitives/page-size-pagination";

export default function Demo(): React.JSX.Element {
  const [page, setPage] = useState(2);
  const [size, setSize] = useState(20);
  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-4 h-32 rounded-xl border border-dashed border-border" aria-hidden="true" />
      <PageSizePagination page={page} pageSize={size} total={312} noun="orders" onPageChange={setPage} onPageSizeChange={setSize} />
    </div>
  );
}
