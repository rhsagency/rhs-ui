import { IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { CenteredHero } from "@rhs-ui/marketing/centered-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <CenteredHero
        announcement={<>New: shared workspaces <a href="#workspaces">See what changed</a></>}
        title="Plan the work. Ship the work. Skip the meeting."
        description="Ledger keeps roadmap, tasks and decisions in one calm place, so a team of eight moves like a team of eight."
        actions={
          <>
            <Button size="lg">Start for free <IconArrowRight /></Button>
            <Button size="lg" variant="outline">Book a demo</Button>
          </>
        }
        note="Free for up to three people. No card needed."
        visual={
          <div className="grid grid-cols-[10rem_1fr] gap-px bg-border text-xs">
            <div className="space-y-2 bg-background p-4">
              {["Roadmap", "This week", "Decisions", "Archive"].map((item, index) => (
                <p key={item} className={index === 1 ? "rounded-md bg-muted px-2 py-1.5 font-medium" : "px-2 py-1.5 text-muted-foreground"}>{item}</p>
              ))}
            </div>
            <div className="space-y-2 bg-background p-4">
              {["Ship onboarding v2", "Review pricing copy", "Plan Q4 offsite", "Fix export timeouts"].map((task, index) => (
                <p key={task} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                  <span className={index < 2 ? "size-3.5 rounded-full bg-foreground" : "size-3.5 rounded-full border border-border"} />
                  {task}
                </p>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
}
