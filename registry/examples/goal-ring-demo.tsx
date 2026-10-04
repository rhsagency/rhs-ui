import { GoalRing } from "@rhs-ui/dashboard/goal-ring";

const euros = (value: number) => `€${Math.round(value / 1000)}k`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-2xl flex-wrap items-start justify-center gap-10 p-10">
      <GoalRing label="Q2 revenue" value={84000} goal={120000} display={euros} note="38 days left" />
      <GoalRing label="New customers" value={131} goal={120} note="Goal beaten" />
      <GoalRing label="Tickets in a day" size="sm" value={412} goal={500} />
    </div>
  );
}
