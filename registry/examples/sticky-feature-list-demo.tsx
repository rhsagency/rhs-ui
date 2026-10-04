import { IconCalendarCheck, IconFileText, IconLock, IconMessages, IconRefresh, IconUsers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { StickyFeatureList } from "@rhs-ui/marketing/sticky-feature-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <StickyFeatureList
        eyebrow="For clinics"
        title="Everything the front desk does, in one place."
        description="Bookings, reminders, intake forms and payments, connected so nobody types the same thing twice."
        action={<Button>See it with your own agenda</Button>}
        features={[
          { icon: <IconCalendarCheck />, title: "Online booking", description: "Patients pick a slot that really is free, per practitioner and per room." },
          { icon: <IconMessages />, title: "Reminders that work", description: "A text the day before cuts no-shows by a third on average." },
          { icon: <IconFileText />, title: "Intake before the visit", description: "Forms are filled in at home and land in the file before the appointment." },
          { icon: <IconRefresh />, title: "Waiting list", description: "A cancellation offers the slot to the next person automatically." },
          { icon: <IconUsers />, title: "Shared agenda", description: "See the whole team at a glance, with colours per treatment." },
          { icon: <IconLock />, title: "Private by design", description: "Data stays in the EU, encrypted, with access logged per person." },
        ]}
      />
    </div>
  );
}
