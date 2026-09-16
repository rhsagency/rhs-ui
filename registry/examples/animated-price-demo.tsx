"use client";
import { useState } from "react";
import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { Button } from "@rhs-ui/primitives/button";
export default function AnimatedPriceDemo(): React.JSX.Element {
  const [quantity, setQuantity] = useState(1);
  return <div className="flex flex-col items-center gap-8 p-8"><p className="text-xs text-muted-foreground">A considered total</p><AnimatedPrice value={quantity * 49.95} locale="nl-NL" className="text-6xl font-medium tracking-tight" /><div className="flex items-center gap-5"><Button aria-label="Decrease quantity" variant="outline" disabled={quantity === 1} onClick={() => setQuantity(quantity - 1)}>−</Button><span aria-live="polite">{quantity}</span><Button aria-label="Increase quantity" variant="outline" onClick={() => setQuantity(quantity + 1)}>+</Button></div></div>;
}
