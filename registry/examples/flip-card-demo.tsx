import { FlipCard } from "@rhs-ui/motion/flip-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-2xl gap-6 p-10 sm:grid-cols-2">
      <FlipCard
        className="h-72"
        label="Show what Team includes"
        front={
          <div className="flex h-full flex-col justify-between p-6">
            <p className="text-sm font-medium">Team</p>
            <p className="text-5xl font-medium tracking-[-.06em]">€12</p>
            <p className="text-xs text-muted-foreground">per person, per month</p>
          </div>
        }
        back={
          <ul className="space-y-2 p-6 text-sm">
            <li>Unlimited projects</li>
            <li>100 GB storage</li>
            <li>Guests included</li>
            <li>30-day audit log</li>
          </ul>
        }
      />
      <FlipCard
        className="h-72"
        label="Show the answer"
        front={<div className="flex h-full items-center justify-center p-6 text-center text-lg font-medium">What does "calm software" mean?</div>}
        back={<p className="p-6 text-sm leading-relaxed text-muted-foreground">Software that waits for you: no badges, no streaks, one digest a day, and a nudge only when something waits on you.</p>}
      />
    </div>
  );
}
