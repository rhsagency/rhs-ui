import { IconCheckCircle, IconMail, IconMessage, IconRocket, IconSparkle } from "@rhs-ui/icons";
import { TrialTimeline } from "@rhs-ui/marketing/trial-timeline";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Three moments in a row: the last one answers the question people came with</p>
      <TrialTimeline
        title="No surprises. Here is your trial, day by day."
        description="Fourteen days of Halcyon Studio with nothing to cancel, because nothing starts until you say so."
        moments={[
          { day: "Today", icon: <IconSparkle />, title: "Full access, no card", description: "Every feature on the Studio plan opens at once. We do not ask for a payment method to start." },
          { day: "Day 12", icon: <IconMail />, title: "We email you a reminder", description: "Two days before the end, with a short summary of what you built and what each plan costs." },
          { day: "Day 14", icon: <IconCheckCircle />, title: "Choose a plan or drop to Free", description: "Your projects stay either way. If you do nothing, you move to Free and nobody is charged." },
        ]}
        action={<Button size="lg">Start your free trial</Button>}
        note="14 days, no credit card, no automatic renewal."
      />

      <div className="mt-20 border-t border-border pt-12">
        <p className="mb-8 text-xs text-muted-foreground">Four moments, no button: for a pricing page that already has one</p>
        <TrialTimeline
          headingLevel={3}
          title="What the first two weeks look like"
          moments={[
            { day: "Day 1", icon: <IconRocket />, title: "Import your projects", description: "Bring in a board from Trello, Linear or a CSV in about five minutes." },
            { day: "Day 3", icon: <IconMessage />, title: "A person checks in", description: "A product specialist writes to ask what you are trying to do, and answers within the day." },
            { day: "Day 12", icon: <IconMail />, title: "Reminder, with the numbers", description: "What you used, what it would cost on each plan, and a link to pick one." },
            { day: "Day 14", icon: <IconCheckCircle />, title: "Nothing is charged", description: "No card was ever on file. Pick a plan, or keep what you have on Free." },
          ]}
        />
      </div>
    </div>
  );
}
