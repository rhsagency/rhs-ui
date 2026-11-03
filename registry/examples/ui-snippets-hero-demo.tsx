import { IconArrowRight } from "@rhs-ui/icons";
import { UiSnippetsHero } from "@rhs-ui/marketing/ui-snippets-hero";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-8 text-xs text-muted-foreground">Three cards a side: a task, a comment, an activity toast and a status card</p>
      <UiSnippetsHero
        className="pt-8 sm:pt-8 lg:pt-12"
        eyebrow="Shared workspaces"
        title="Where the whole team keeps the work moving"
        description="Tasks, threads and updates in one place, so nobody has to ask where things stand."
        actions={
          <>
            <Button size="lg">
              Start for free
              <IconArrowRight />
            </Button>
            <Button size="lg" variant="outline">
              Book a demo
            </Button>
          </>
        }
        start={[
          { kind: "task", title: "Draft the Q4 launch brief", assignee: { name: "Maya Chen" }, due: "Fri 14", label: "Marketing" },
          { kind: "comment", author: { name: "Tomas Brandt" }, text: "Moved the review to Thursday so legal can join.", time: "2m", replyPlaceholder: "Reply to Tomas" },
          { kind: "activity", text: "Priya completed Design handoff", time: "just now" },
        ]}
        end={[
          { kind: "status", title: "Sprint 24", status: "On track", progress: 72, detail: "18 of 25 tasks done" },
          { kind: "task", title: "Review the vendor contract", assignee: { name: "Priya Shah" }, due: "Mon 10", label: "Legal", done: true },
          { kind: "comment", author: { name: "Sofia Ortiz" }, text: "Looks good to me. Sending the draft tonight.", time: "12m", replyPlaceholder: "Reply to Sofia" },
        ]}
      />
      <p className="border-t border-border pt-8 text-xs text-muted-foreground">Two cards a side and one action, for a smaller story</p>
      <UiSnippetsHero
        className="pt-8 sm:pt-8 lg:pt-12"
        title="Design reviews that end with a decision"
        description="Comments stay on the frame they are about, and the thread closes when the change ships."
        actions={
          <Button size="lg">
            Try it with your team
            <IconArrowRight />
          </Button>
        }
        start={[
          { kind: "comment", author: { name: "Priya Shah" }, text: "Can we try the tighter spacing on the pricing frame?", time: "5m", replyPlaceholder: "Reply to Priya" },
          { kind: "task", title: "Update the pricing frame", assignee: { name: "Maya Chen" }, due: "Tue 11", label: "Design", done: true },
        ]}
        end={[
          { kind: "status", title: "Launch checklist", status: "At risk", progress: 44, detail: "4 of 9 items done" },
          { kind: "activity", text: "Tomas approved the new header", time: "2 minutes ago" },
        ]}
      />
    </div>
  );
}
