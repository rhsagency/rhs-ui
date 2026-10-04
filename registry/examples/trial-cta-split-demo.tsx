import { Button } from "@rhs-ui/primitives/button";
import { TrialCtaSplit } from "@rhs-ui/marketing/trial-cta-split";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <TrialCtaSplit
        title="Try every feature for 14 days."
        description="Bring your team, import a project, and see if it sticks."
        includes={["Unlimited projects and guests", "Imports from Trello, Asana and Jira", "Priority support during the trial"]}
        actions={
          <>
            <Button size="lg">Start the trial</Button>
            <Button size="lg" variant="outline">Talk to sales</Button>
          </>
        }
        note="No card needed. Your data stays if you upgrade."
        visual={
          <div className="grid h-full grid-cols-3 gap-3 p-5 text-xs">
            {["To do", "Doing", "Done"].map((column, index) => (
              <div key={column} className="space-y-2">
                <p className="font-medium text-muted-foreground">{column}</p>
                {Array.from({ length: 4 - index }, (_, card) => (
                  <p key={card} className="rounded-lg border border-border bg-background p-3">Task {index * 4 + card + 1}</p>
                ))}
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}
