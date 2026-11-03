import { TimetableHero, type TimetableSession } from "@rhs-ui/marketing/timetable-hero";
import { Button } from "@rhs-ui/primitives/button";

const at = (day: string, time: string) => `${day}T${time}:00+01:00`;

const wednesday: TimetableSession[] = [
  { id: "wed-0700", startsAt: at("2026-11-04", "07:00"), name: "Reformer Pilates", coach: "Ana Costa", spots: 3, capacity: 12, href: "#reformer-0700" },
  { id: "wed-0930", startsAt: at("2026-11-04", "09:30"), name: "Vinyasa flow", coach: "Lena Visser", spots: 4, capacity: 16, href: "#vinyasa-0930" },
  { id: "wed-1215", startsAt: at("2026-11-04", "12:15"), name: "Lunchtime strength", coach: "Mateo Ruiz", spots: 0, capacity: 10, href: "#strength-1215" },
  { id: "wed-1730", startsAt: at("2026-11-04", "17:30"), name: "Mobility and stretch", coach: "Ana Costa", spots: 9, capacity: 16, href: "#mobility-1730" },
  { id: "wed-1900", startsAt: at("2026-11-04", "19:00"), name: "Yin and restore", coach: "Lena Visser", spots: 2, capacity: 14, href: "#yin-1900" },
];

const thursday: TimetableSession[] = [
  { id: "thu-0700", startsAt: at("2026-11-05", "07:00"), name: "Reformer Pilates", coach: "Ana Costa", spots: 8, capacity: 12, href: "#reformer-thu" },
  { id: "thu-0930", startsAt: at("2026-11-05", "09:30"), name: "Boxing fundamentals", coach: "Mateo Ruiz", spots: 6, capacity: 12, href: "#boxing-thu" },
];

const actions = (
  <>
    <Button asChild size="lg">
      <a href="#book">Book a class</a>
    </Button>
    <Button asChild size="lg" variant="outline">
      <a href="#timetable">See the full timetable</a>
    </Button>
  </>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Wednesday at 08:15 in Utrecht: the 07:00 class has begun, lunchtime is full, and the last class has two places left.</p>
      <TimetableHero
        className="py-8 sm:py-10 lg:py-12"
        title="Today at Halcyon Studio"
        description="Pilates, yoga and strength in the middle of Utrecht. Book a spot, or just walk in."
        actions={actions}
        sessions={wednesday}
        timeZone="Europe/Amsterdam"
        now="2026-11-04T08:15:00+01:00"
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">Wednesday at 20:40, in 12-hour times: the last class has begun, so the row says so and shows how Thursday starts.</p>
      <TimetableHero
        className="py-8 sm:py-10 lg:py-12"
        title="Today at Halcyon Studio"
        description="Pilates, yoga and strength in the middle of Utrecht. Book a spot, or just walk in."
        actions={actions}
        sessions={[...wednesday, ...thursday]}
        timeZone="Europe/Amsterdam"
        hourCycle="h12"
        now="2026-11-04T20:40:00+01:00"
      />
    </div>
  );
}
