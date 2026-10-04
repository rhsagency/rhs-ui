import { AgendaList } from "@rhs-ui/application/agenda-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg p-6">
      <AgendaList
        days={[
          {
            label: "Today",
            events: [
              { id: "1", title: "Design review", start: "09:30", end: "10:15", dateTime: "2026-04-14T09:30", location: "Room 2 and video" },
              { id: "2", title: "Customer call: Halcyon", start: "11:00", end: "11:30", dateTime: "2026-04-14T11:00", location: "Video", now: true },
              { id: "3", title: "Ship onboarding v2", start: "16:00", dateTime: "2026-04-14T16:00" },
            ],
          },
          { label: "Wed 15 April", events: [] },
          { label: "Thu 16 April", events: [{ id: "4", title: "Quarterly planning", start: "10:00", end: "12:00", dateTime: "2026-04-16T10:00", location: "Studio" }] },
        ]}
      />
    </div>
  );
}
