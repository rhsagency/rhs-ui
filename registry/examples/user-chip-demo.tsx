import { UserChip } from "@rhs-ui/primitives/user-chip";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-sm gap-4 p-8">
      <UserChip name="Anouk de Wit" detail="anouk@example.com" status="online" />
      <UserChip name="Ravi Menon" detail="Engineering lead" status="busy" />
      <UserChip name="Lotte Visser" status="away" size="sm" />
    </div>
  );
}
