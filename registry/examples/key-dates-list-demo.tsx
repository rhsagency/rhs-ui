import { KeyDatesList } from "@rhs-ui/marketing/key-dates-list";

const calendar = (
  <a href="#calendar" className="text-foreground">
    Add to calendar
  </a>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="mb-6 text-xs text-muted-foreground">Grouped by month, on 20 October: two dates have passed and the half-term is next</p>
      <KeyDatesList
        today="2026-10-20"
        locale="en-GB"
        dates={[
          { start: "2026-09-01", label: "Autumn term begins", note: "Pupils in years 1 to 6 start at 08:45.", type: "Term" },
          { start: "2026-10-08", label: "Open evening", note: "Meet the teachers and see the classrooms, 18:00 to 20:00.", type: "Event" },
          { start: "2026-10-26", end: "2026-10-30", label: "Autumn half-term", note: "School is closed. Clubs start again on Monday 2 November.", type: "Holiday", calendar },
          { start: "2026-11-12", label: "Parents' evening", note: "Ten-minute slots, booked online from 29 October.", type: "Event", href: "#parents-evening", calendar },
          { start: "2026-11-23", end: "2026-12-04", label: "Mock exams, years 10 and 11", note: "Timetables go home on 9 November.", type: "Exam" },
          { start: "2026-12-11", label: "Applications for 2027 entry close", note: "Forms must arrive by 15:00.", type: "Deadline", href: "#applications" },
          { start: "2026-12-21", end: "2027-01-01", label: "Winter holiday", type: "Holiday" },
          { start: "2027-01-04", label: "Spring term begins", note: "Pupils in years 1 to 6 start at 08:45.", type: "Term" },
        ]}
      />

      <p className="mt-16 mb-6 text-xs text-muted-foreground">Grouped by term, on 22 December: the closure is under way and the new block is next</p>
      <KeyDatesList
        today="2026-12-22"
        locale="en-GB"
        groupBy="term"
        headingLevel={3}
        dates={[
          { start: "2026-12-21", end: "2027-01-03", term: "Winter block", label: "Studio closed", note: "Online classes continue on the usual days.", type: "Closed" },
          { start: "2027-01-11", term: "Spring block", label: "Spring block starts", note: "Ten weeks. Booking opens on 4 January.", type: "Term", calendar },
          { start: "2027-02-15", end: "2027-02-19", term: "Spring block", label: "Half-term week", note: "A reduced timetable, mornings only.", type: "Changed hours" },
        ]}
      />
    </div>
  );
}
