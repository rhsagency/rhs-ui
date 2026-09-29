import { StatusDot } from "@rhs-ui/application/status-dot";

const TEAM = [
  { name: "Mara Jansen", role: "Design", status: "online" },
  { name: "Tomás Reyes", role: "Engineering", status: "away" },
  { name: "Aiko Sato", role: "Support", status: "busy" },
  { name: "Leon Weber", role: "Sales", status: "offline" },
] as const;

export default function StatusDotDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <ul className="grid divide-y divide-border rounded-lg border border-border">
        {TEAM.map((person) => (
          <li key={person.name} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="grid">
              <span className="font-medium">{person.name}</span>
              <span className="text-xs text-muted-foreground">{person.role}</span>
            </span>
            <StatusDot status={person.status} showLabel />
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <StatusDot status="online" pulse /> All systems operational
      </p>
    </div>
  );
}
