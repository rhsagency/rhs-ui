"use client";

import { BookingSection } from "@rhs-ui/marketing/booking-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <BookingSection
        title="Book a walkthrough."
        description="Pick a time that suits you. We will send a calendar invite with the video link."
        duration="30 minutes, video call"
        days={[
          { id: "2026-04-13", weekday: "Mon", date: "13 Apr", slots: ["09:30", "11:00", "14:00", "15:30"] },
          { id: "2026-04-14", weekday: "Tue", date: "14 Apr", slots: ["10:00", "13:30"] },
          { id: "2026-04-15", weekday: "Wed", date: "15 Apr", slots: [] },
          { id: "2026-04-16", weekday: "Thu", date: "16 Apr", slots: ["09:00", "09:30", "10:00", "16:00"] },
          { id: "2026-04-17", weekday: "Fri", date: "17 Apr", slots: ["11:30"] },
        ]}
        onBook={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
      />
    </div>
  );
}
