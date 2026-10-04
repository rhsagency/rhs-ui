import { EventsList } from "@rhs-ui/marketing/events-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6">
      <EventsList
        title="Upcoming events"
        description="Meetups, workshops and office hours. Bring a laptop and a question."
        events={[
          { href: "#ams", title: "Calm Software meetup, Amsterdam", day: "14", month: "Apr", dateTime: "2026-04-14T18:30", time: "18:30 to 21:00", place: "Amsterdam", price: "Free" },
          { href: "#workshop", title: "Workshop: a roadmap in one afternoon", day: "22", month: "Apr", dateTime: "2026-04-22T13:00", time: "13:00 to 17:00", place: "Utrecht", price: "€95" },
          { href: "#office-hours", title: "Office hours with the product team", day: "29", month: "Apr", dateTime: "2026-04-29T16:00", time: "16:00 to 17:00", place: "Online", online: true, price: "Free" },
        ]}
      />
    </div>
  );
}
