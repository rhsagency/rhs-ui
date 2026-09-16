"use client";
import { useState } from "react";
import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { Button } from "@rhs-ui/primitives/button";
export default function AnimatedNumberDemo(): React.JSX.Element {
  const [value, setValue] = useState(1284);
  return <div className="flex flex-col items-center gap-8 p-8"><p className="text-xs text-muted-foreground">People building something good</p><AnimatedNumber value={value} className="text-6xl font-medium tracking-tight" /><div className="flex gap-2"><Button variant="outline" onClick={() => setValue(value - 137)}>Decrease</Button><Button onClick={() => setValue(value + 253)}>Increase</Button></div></div>;
}
