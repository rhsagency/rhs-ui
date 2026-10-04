import { OpeningHours } from "@rhs-ui/primitives/opening-hours";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xs p-8">
      <OpeningHours
        today={1}
        status={{ open: true, text: "Open now, until 18:00" }}
        note="Closed on 27 April (King's Day)."
        days={[
          { day: "Monday", hours: null },
          { day: "Tuesday", hours: "09:00 to 18:00" },
          { day: "Wednesday", hours: "09:00 to 18:00" },
          { day: "Thursday", hours: "09:00 to 21:00" },
          { day: "Friday", hours: "09:00 to 18:00" },
          { day: "Saturday", hours: "10:00 to 17:00" },
          { day: "Sunday", hours: null },
        ]}
      />
    </div>
  );
}
