import { MaintenanceBanner } from "@rhs-ui/primitives/maintenance-banner";

export default function Demo(): React.JSX.Element {
  const link = <a href="#status" className="font-medium underline underline-offset-4">Status page</a>;
  return (
    <div className="mx-auto grid max-w-2xl gap-3 p-8">
      <MaintenanceBanner title="Planned maintenance on Sunday 19 April" window="02:00 to 04:00 CEST" startDateTime="2026-04-19T02:00+02:00" impact="Reading works; saving is paused for up to ten minutes" action={link} />
      <MaintenanceBanner phase="active" title="database upgrade" window="Until about 04:00 CEST" startDateTime="2026-04-19T02:00+02:00" impact="Saving is paused" action={link} />
    </div>
  );
}
