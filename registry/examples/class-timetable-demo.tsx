import { ClassTimetable } from "@rhs-ui/marketing/class-timetable";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="mb-6 text-xs text-muted-foreground">A studio week on Tuesday: today is marked, three classes are full and two of them offer a waitlist</p>
      <ClassTimetable
        today="tue"
        legend="Places are updated every five minutes. Cancel up to two hours before a class and your place goes to the next person."
        days={[
          {
            id: "mon",
            label: "Monday",
            short: "Mon",
            classes: [
              { start: "07:00", end: "07:45", name: "Morning strength", trainer: "Jonas Weber", level: "All levels", spots: 6, href: "#morning-strength" },
              { start: "12:15", end: "13:00", name: "Express mobility", trainer: "Noor Haddad", level: "All levels", spots: 12, href: "#express-mobility" },
              { start: "18:30", end: "19:30", name: "Yoga flow", trainer: "Noor Haddad", level: "Beginner", spots: 3, href: "#yoga-flow" },
              { start: "19:45", end: "20:45", name: "Boxing fundamentals", trainer: "Dario Costa", level: "Beginner", spots: 9, href: "#boxing" },
            ],
          },
          {
            id: "tue",
            label: "Tuesday",
            short: "Tue",
            classes: [
              { start: "06:30", end: "07:15", name: "Spin", trainer: "Marta Kowalski", level: "Intermediate", spots: 0, href: "#spin", waitlistHref: "#spin-waitlist" },
              { start: "9:30", end: "10:30", name: "Reformer pilates", trainer: "Elin Åberg", level: "Beginner", spots: 2, href: "#reformer" },
              { start: "17:30", end: "18:30", name: "Strength and conditioning", trainer: "Jonas Weber", level: "Advanced", spots: 0, href: "#strength" },
              { start: "19:00", end: "20:00", name: "Barre", trainer: "Elin Åberg", level: "All levels", spots: 7, href: "#barre" },
            ],
          },
          {
            id: "wed",
            label: "Wednesday",
            short: "Wed",
            classes: [
              { start: "07:00", end: "07:45", name: "Morning strength", trainer: "Jonas Weber", level: "All levels", spots: 8, href: "#morning-strength" },
              { start: "12:15", end: "13:00", name: "Lunch cycle", trainer: "Marta Kowalski", level: "All levels", spots: 14, href: "#lunch-cycle" },
              { start: "18:00", end: "19:00", name: "Reformer pilates", trainer: "Elin Åberg", level: "Intermediate", spots: 4, href: "#reformer" },
              { start: "19:15", end: "20:15", name: "Breathwork and meditation", trainer: "Noor Haddad", level: "All levels", spots: 15, href: "#breathwork" },
            ],
          },
          {
            id: "thu",
            label: "Thursday",
            short: "Thu",
            classes: [
              { start: "06:30", end: "07:15", name: "Spin", trainer: "Marta Kowalski", level: "Intermediate", spots: 5, href: "#spin" },
              { start: "11:30", end: "12:30", name: "Midday HIIT", trainer: "Dario Costa", level: "Intermediate", spots: 8, href: "#midday-hiit" },
              { start: "17:30", end: "18:30", name: "Boxing fundamentals", trainer: "Dario Costa", level: "Beginner", spots: 0, href: "#boxing", waitlistHref: "#boxing-waitlist" },
              { start: "18:45", end: "19:45", name: "Yoga flow", trainer: "Noor Haddad", level: "Beginner", spots: 10, href: "#yoga-flow" },
            ],
          },
          {
            id: "fri",
            label: "Friday",
            short: "Fri",
            classes: [
              { start: "07:00", end: "07:45", name: "Morning strength", trainer: "Jonas Weber", level: "All levels", spots: 11, href: "#morning-strength" },
              { start: "12:15", end: "13:00", name: "Express mobility", trainer: "Noor Haddad", level: "All levels", spots: 13, href: "#express-mobility" },
              { start: "17:00", end: "18:00", name: "Friday finisher", trainer: "Dario Costa", level: "Advanced", spots: 1, href: "#finisher" },
            ],
          },
          {
            id: "sat",
            label: "Saturday",
            short: "Sat",
            classes: [
              { start: "09:00", end: "10:00", name: "Long run club", trainer: "Marta Kowalski", level: "All levels", spots: 20, href: "#run-club" },
              { start: "10:30", end: "11:30", name: "Family yoga", trainer: "Noor Haddad", level: "All ages", spots: 6, href: "#family-yoga" },
            ],
          },
          { id: "sun", label: "Sunday", short: "Sun", classes: [] },
        ]}
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">Five days, no day marked, times on the 24-hour clock (en-GB)</p>
      <ClassTimetable
        locale="en-GB"
        headingLevel={4}
        days={[
          { id: "mon", label: "Monday", classes: [{ start: "15:30", end: "16:30", name: "Chess club", trainer: "Mr Alvarez", level: "Years 3 to 6", spots: 4 }] },
          {
            id: "tue",
            label: "Tuesday",
            classes: [
              { start: "15:30", end: "16:15", name: "Choir", trainer: "Ms Okafor", level: "All years", spots: 0 },
              { start: "16:30", end: "17:30", name: "Coding for beginners", trainer: "Ms Lindqvist", level: "Years 4 to 6", spots: 8 },
            ],
          },
          { id: "wed", label: "Wednesday", classes: [{ start: "15:30", end: "16:30", name: "Football", trainer: "Mr Hughes", level: "Years 2 to 6", spots: 12 }] },
          { id: "thu", label: "Thursday", classes: [{ start: "15:30", end: "16:30", name: "Art studio", trainer: "Ms Tanaka", level: "All years", spots: 5 }] },
          { id: "fri", label: "Friday", classes: [] },
        ]}
      />
    </div>
  );
}
