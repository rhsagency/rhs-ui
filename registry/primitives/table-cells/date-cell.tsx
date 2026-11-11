"use client";

import { useEffect, useState } from "react";

import type { DateCellProps } from "@rhs-ui/primitives/table-cells";
import { fullDate, isDateOnly, relativeDate, shortDate, toDate } from "@rhs-ui/primitives/table-cells/format";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/**
 * The part of DateCell that needs the browser: once it is mounted it can say "3 days ago" without a `now`. It is a client
 * component of its own so that the rest of the cells stay server components. Use DateCell, which renders this.
 */
export function DateCellView({ value, locale = "en-US", timeZone = "UTC", now, relative = true, relativeWithin = 30, dateOnly, emptyLabel = "No date", className, ...props }: DateCellProps) {
  // Without a `now` the relative form waits for the browser: the server and the first client render both write the date.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const date = toDate(value);
  if (!date) {
    return (
      <span data-slot="date-cell" className={cn("whitespace-nowrap text-muted-foreground", className)}>
        <span aria-hidden="true">-</span>
        <span className="sr-only">{emptyLabel}</span>
      </span>
    );
  }

  const options = { locale, timeZone, dateOnly: dateOnly ?? isDateOnly(value) };
  const reference = now !== undefined ? toDate(now) : mounted ? new Date() : null;
  const words = relative && reference ? relativeDate(date, reference, { ...options, within: relativeWithin }) : null;
  const full = fullDate(date, options);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <time data-slot="date-cell" dateTime={options.dateOnly ? date.toISOString().slice(0, 10) : date.toISOString()} className={cn("inline-block whitespace-nowrap tabular-nums first-letter:uppercase", className)} {...props}>
            {words ?? shortDate(date, options)}
            {words ? <span className="sr-only">{`, ${full}`}</span> : null}
          </time>
        </TooltipTrigger>
        <TooltipContent>{full}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
