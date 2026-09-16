"use client";

import { useMemo } from "react";
import { AnimatedNumber, type AnimatedNumberProps } from "@rhs-ui/application/animated-number";

export interface AnimatedPriceProps extends Omit<AnimatedNumberProps, "format"> { currency?: string }

/** A locale-aware price using the shared number transition. */
export function AnimatedPrice({ currency = "EUR", ...props }: AnimatedPriceProps): React.JSX.Element {
  const format = useMemo<Intl.NumberFormatOptions>(() => ({ style: "currency", currency }), [currency]);
  return <AnimatedNumber {...props} format={format} />;
}
