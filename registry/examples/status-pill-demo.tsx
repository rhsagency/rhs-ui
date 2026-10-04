import { StatusPill } from "@rhs-ui/primitives/status-pill";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex min-h-40 flex-wrap items-center justify-center gap-3 p-6">
      <StatusPill status="operational" href="#status" />
      <StatusPill status="degraded" label="Search is slow" />
      <StatusPill status="outage" />
      <StatusPill status="maintenance" label="Maintenance Sunday 02:00" />
    </div>
  );
}
