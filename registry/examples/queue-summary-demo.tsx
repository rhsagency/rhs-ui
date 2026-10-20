import { QueueSummary, type Queue } from "@rhs-ui/dashboard/queue-summary";

const QUEUES: readonly Queue[] = [
  { label: "Orders to ship", count: 124, href: "#orders?status=unfulfilled", urgent: true },
  { label: "Tickets unanswered", count: 7, href: "#tickets?status=open" },
  { label: "Reviews to moderate", count: 0, href: "#reviews?status=pending" },
  { label: "Returns to inspect", count: 12, href: "#returns?status=received" },
];

const FEW: readonly Queue[] = [
  { label: "Drafts to publish", count: 3, href: "#drafts" },
  { label: "Comments to approve", count: 0, href: "#comments" },
  { label: "Payouts to review", count: 2, href: "#payouts", urgent: true },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl gap-10">
      <section className="grid gap-3">
        <p className="text-xs text-muted-foreground">Over 99 reads 99+ and keeps its exact number for screen readers. Zero is quiet. Urgent says so in words.</p>
        <QueueSummary queues={QUEUES} />
      </section>

      <section className="grid items-start gap-8 md:grid-cols-2">
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground">Loading</p>
          <QueueSummary queues={[]} loading />
        </div>
        <div className="grid gap-3">
          <p className="text-xs text-muted-foreground">A narrow column wraps to two, three queues</p>
          <QueueSummary queues={FEW} />
        </div>
      </section>
    </div>
  );
}
