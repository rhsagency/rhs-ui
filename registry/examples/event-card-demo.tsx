import { Button } from "@rhs-ui/primitives/button";
import { EventCard } from "@rhs-ui/primitives/event-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-md gap-3 p-8">
      <EventCard title="Calm Software meetup, Amsterdam" day="14" month="Apr" dateTime="2026-04-14T18:30" time="18:30 to 21:00" place="Haarlemmerstraat 112" href="#meetup" attendees="42 going" action={<Button size="sm">RSVP</Button>} />
      <EventCard title="Office hours with the product team" day="29" month="Apr" dateTime="2026-04-29T16:00" time="16:00 to 17:00" place="Online" online attendees="18 going" action={<Button size="sm" variant="outline">Add to calendar</Button>} />
    </div>
  );
}
