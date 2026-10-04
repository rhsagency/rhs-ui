import { PullQuote } from "@rhs-ui/primitives/pull-quote";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <p className="text-sm leading-relaxed text-muted-foreground">For a year we built software that waited: no red dots, no streaks, no weekly email about what people had missed.</p>
      <PullQuote quote="The best notification is the one you never had to send." cite="Anouk de Wit" source="Field Notes, March 2026" />
      <p className="text-sm leading-relaxed text-muted-foreground">Daily opens went down. Finished work went up.</p>
    </div>
  );
}
