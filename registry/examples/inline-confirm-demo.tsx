"use client";

import { useState } from "react";

import { IconTrash } from "@rhs-ui/icons";
import { InlineConfirm } from "@rhs-ui/primitives/inline-confirm";

export default function Demo(): React.JSX.Element {
  const [rows, setRows] = useState(["Q1 report.pdf", "Brand guide.pdf", "Invoice 2041.pdf"]);
  return (
    <div className="mx-auto max-w-md p-8">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => (
          <li key={row} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
            {row}
            <InlineConfirm question="Delete?" onConfirm={() => new Promise<void>((resolve) => setTimeout(() => { setRows((list) => list.filter((item) => item !== row)); resolve(); }, 400))}><IconTrash /> Delete</InlineConfirm>
          </li>
        ))}
      </ul>
      {!rows.length ? <button type="button" className="mt-3 text-sm underline underline-offset-4" onClick={() => setRows(["Q1 report.pdf", "Brand guide.pdf", "Invoice 2041.pdf"])}>Restore the files</button> : null}
    </div>
  );
}
