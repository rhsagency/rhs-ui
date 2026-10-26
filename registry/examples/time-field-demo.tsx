"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { TimeField, type TimeFieldProps } from "@rhs-ui/primitives/time-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ label, ...props }: Omit<TimeFieldProps, "id" | "aria-labelledby"> & { label: string }): React.JSX.Element {
  const id = useId();
  const labelId = useId();
  return (
    <div className="grid justify-items-start gap-2">
      <Label id={labelId} htmlFor={id}>
        {label}
      </Label>
      <TimeField id={id} aria-labelledby={labelId} {...props} />
    </div>
  );
}

function Pickup(): React.JSX.Element {
  const [time, setTime] = useState<string | null>("09:30");
  const [booked, setBooked] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (time) setBooked(time);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Book a Northwind pickup</h2>
        <p className="text-xs text-muted-foreground">Type the time, or step a part with the arrow keys. Pickups run from 8:00 AM to 6:00 PM, every 15 minutes.</p>
      </div>
      <Field
        label="Pickup time"
        name="pickup"
        min="08:00"
        max="18:00"
        minuteStep={15}
        value={time}
        onValueChange={(next) => {
          setTime(next);
          setBooked(null);
        }}
      />
      <Button type="submit" disabled={!time}>
        Book this slot
      </Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {booked ? (
          <span>Booked for {booked}</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(time)}</code>
          </>
        )}
      </p>
    </form>
  );
}

function OpeningHours(): React.JSX.Element {
  const [opens, setOpens] = useState<string | null>("09:00");
  const [closes, setCloses] = useState<string | null>("17:30");
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-4">
      <Field label="Opens" locale="en-GB" hour12={false} value={opens} onValueChange={setOpens} />
      {/* The connector goes with the second field, so that when the row wraps it never stays behind at the end of the first line. */}
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="pt-[1.875rem] text-sm text-muted-foreground">
          to
        </span>
        <Field label="Closes" locale="en-GB" hour12={false} min={opens ?? undefined} value={closes} onValueChange={setCloses} />
      </div>
    </div>
  );
}

const SCHEDULE = [
  { day: "Mon", opens: "09:00", closes: "17:30" },
  { day: "Tue", opens: "09:00", closes: "17:30" },
  { day: "Wed", opens: "09:00", closes: "21:00" },
  { day: "Thu", opens: "09:00", closes: "17:30" },
] as const;

// Room is tight in a phone's width: the cells give a little padding back.
const CELL = "px-2 sm:px-3";

function Schedule(): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <Table aria-label="Opening hours of the Halcyon showroom">
        <TableHeader>
          <TableRow>
            <TableHead className={CELL}>Day</TableHead>
            <TableHead className={CELL}>Opens</TableHead>
            <TableHead className={CELL}>Closes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SCHEDULE.map((row) => (
            <TableRow key={row.day}>
              <TableCell className={`${CELL} font-medium`}>{row.day}</TableCell>
              <TableCell className={CELL}>
                <TimeField size="sm" showIcon={false} locale="nl-NL" defaultValue={row.opens} aria-label={`${row.day}, opens`} />
              </TableCell>
              <TableCell className={CELL}>
                <TimeField size="sm" showIcon={false} locale="nl-NL" defaultValue={row.closes} min={row.opens} aria-label={`${row.day}, closes`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: the parts hand over to each other as you type. Press a or p for AM and PM">
          <Pickup />
        </Example>
        <Example caption="A time outside min and max names the range, in the words of the clock">
          <Field label="Delivery window" defaultValue="07:30" min="09:00" max="17:00" />
        </Example>
        <Example caption="Disabled">
          <Field label="Pickup time" defaultValue="14:15" disabled />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Either side of a range: Closes takes its min from Opens, on the 24-hour clock of en-GB">
          <OpeningHours />
        </Example>
        <Example caption="The locale writes the clock: the Netherlands uses 24 hours, and hour12 turns on AM and PM anywhere">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-5">
            <Field label="Aankomst" locale="nl-NL" defaultValue="14:30" />
            <Field label="Arrival" locale="nl-NL" hour12 defaultValue="14:30" />
          </div>
        </Example>
        <Example caption="Short enough for a table cell">
          <Schedule />
        </Example>
      </div>
    </div>
  );
}
