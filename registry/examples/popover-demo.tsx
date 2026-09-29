"use client";

import { useId, useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";

export default function Demo(): React.JSX.Element {
  const id = useId();
  const [size, setSize] = useState({ width: "1200", height: "630" });

  return (
    <div className="flex flex-col items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            Canvas size <span className="font-mono text-xs text-muted-foreground">{size.width} × {size.height}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-labelledby={`${id}-title`}>
          <div className="grid gap-4">
            <div className="grid gap-1">
              <h4 id={`${id}-title`} className="text-sm font-medium">Canvas size</h4>
              <p className="text-xs text-muted-foreground">In pixels. A share card is 1200 × 630.</p>
            </div>
            {(["width", "height"] as const).map((side) => (
              <div key={side} className="grid grid-cols-[5rem_1fr] items-center gap-3">
                <Label htmlFor={`${id}-${side}`} className="capitalize">
                  {side}
                </Label>
                <Input
                  id={`${id}-${side}`}
                  inputMode="numeric"
                  value={size[side]}
                  onChange={(event) => setSize((current) => ({ ...current, [side]: event.target.value.replace(/\D/g, "").slice(0, 5) }))}
                  className="h-8"
                />
              </div>
            ))}
            <PopoverClose asChild>
              <Button size="sm" className="justify-self-end">
                Done
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">Focus moves in, Escape brings it back.</p>
    </div>
  );
}
