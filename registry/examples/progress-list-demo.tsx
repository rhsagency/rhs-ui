import { ProgressList } from "@rhs-ui/dashboard/progress-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md p-8">
      <ProgressList
        title="Quarter targets"
        items={[
          { id: "revenue", label: "New revenue", value: 84, target: 120, display: "€84k of €120k" },
          { id: "deals", label: "Closed deals", value: 31, target: 30, display: "31 of 30" },
          { id: "tickets", label: "Tickets solved in a day", value: 412, target: 500, display: "412 of 500" },
          { id: "nps", label: "Survey replies", value: 96, target: 300, display: "96 of 300" },
        ]}
      />
    </div>
  );
}
