import { Button } from "@rhs-ui/primitives/button";
import { EventHero } from "@rhs-ui/marketing/event-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <EventHero
        kind="Conference"
        title="Calm Software Summit 2026"
        description="Two days on building products people trust, with talks you can use on Monday."
        date="12 to 13 June 2026"
        dateTime="2026-06-12"
        venue="Tivoli, Utrecht"
        capacity="600 seats, 112 left"
        actions={
          <>
            <Button size="lg">Get a ticket</Button>
            <Button size="lg" variant="outline">See the programme</Button>
          </>
        }
        aside={
          <dl className="grid grid-cols-3 gap-4 text-center">
            {[["28", "talks"], ["6", "workshops"], ["2", "days"]].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-4xl font-medium tracking-[-.05em] tabular-nums">{value}</dd>
                <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        }
      />
    </div>
  );
}
