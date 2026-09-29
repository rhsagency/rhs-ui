"use client";

import { useState } from "react";

import { Resizable } from "@rhs-ui/primitives/resizable";

export default function Demo(): React.JSX.Element {
  const [size, setSize] = useState(32);
  return (
    <div className="grid w-full max-w-2xl gap-3">
      <Resizable
        className="h-64"
        size={size}
        onSizeChange={setSize}
        label="Resize the file list"
        start={
          <div className="grid gap-1 p-3 font-mono text-xs">
            {["app", "components", "lib", "public", "README.md"].map((file) => (
              <span key={file} className="truncate rounded px-2 py-1 hover:bg-muted">
                {file}
              </span>
            ))}
          </div>
        }
        end={
          <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
            Drag the handle, or focus it and use the arrow keys.
          </div>
        }
      />
      <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        Sidebar at {size}%
      </p>
    </div>
  );
}
