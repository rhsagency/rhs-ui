"use client";

import { useState } from "react";

import { IconArchive, IconDownload, IconTrash } from "@rhs-ui/icons";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FloatingActionBar } from "@rhs-ui/primitives/floating-action-bar";

const FILES = ["Q1 report.pdf", "Brand guide.pdf", "Invoice 2041.pdf", "Offer Northwind.pdf"];

export default function Demo(): React.JSX.Element {
  const [picked, setPicked] = useState<string[]>(FILES.slice(0, 2));
  const toggle = (file: string) => setPicked((list) => (list.includes(file) ? list.filter((item) => item !== file) : [...list, file]));
  return (
    <div className="relative mx-auto h-80 max-w-md overflow-hidden p-8">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {FILES.map((file, index) => (
          <li key={file} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <Checkbox id={`fab-${index}`} checked={picked.includes(file)} onCheckedChange={() => toggle(file)} />
            <label htmlFor={`fab-${index}`}>{file}</label>
          </li>
        ))}
      </ul>
      <FloatingActionBar className="absolute" open={picked.length > 0} label={`${picked.length} selected`} onDismiss={() => setPicked([])}>
        <button type="button" className="rounded-xl p-2" aria-label="Download"><IconDownload className="size-4" /></button>
        <button type="button" className="rounded-xl p-2" aria-label="Archive"><IconArchive className="size-4" /></button>
        <button type="button" className="rounded-xl p-2" aria-label="Delete"><IconTrash className="size-4" /></button>
      </FloatingActionBar>
    </div>
  );
}
