"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Drawer } from "@rhs-ui/primitives/drawer";

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto flex min-h-64 max-w-sm items-center justify-center p-8">
      <Drawer open={open} onOpenChange={setOpen} trigger={<Button>Filter results</Button>} title="Filters" description="Drag the handle down or tap outside to close.">
        <div className="grid gap-3 text-sm">
          {["In stock only", "Free delivery", "On sale", "Recycled materials"].map((option, index) => (
            <label key={option} htmlFor={`drawer-filter-${index}`} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              {option}
              <Checkbox id={`drawer-filter-${index}`} defaultChecked={index === 0} />
            </label>
          ))}
          <Button className="mt-2" onClick={() => setOpen(false)}>Show 128 results</Button>
        </div>
      </Drawer>
    </div>
  );
}
