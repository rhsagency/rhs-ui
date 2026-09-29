"use client";

import { useId, useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";

const LIMIT = 280;

export default function Demo(): React.JSX.Element {
  const id = useId();
  const [text, setText] = useState("");
  const left = LIMIT - text.length;

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>What should we build next?</Label>
      <Textarea
        id={id}
        value={text}
        maxLength={LIMIT}
        onChange={(event) => setText(event.target.value)}
        placeholder="A component you keep rebuilding, a block you miss..."
        aria-describedby={`${id}-count`}
      />
      <p id={`${id}-count`} className="flex justify-between text-xs text-muted-foreground">
        <span>The field grows as you write.</span>
        <span className="font-mono tabular-nums" aria-live={left <= 20 ? "polite" : "off"}>
          {left} left
        </span>
      </p>
    </div>
  );
}
