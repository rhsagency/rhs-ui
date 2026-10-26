import { ValuesRows } from "@rhs-ui/marketing/values-rows";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <ValuesRows
        eyebrow="How we work"
        title="Four things we hold ourselves to"
        description="Northwind has written these down so that you can hold us to them. Each one comes with what it looks like on an ordinary Tuesday, and what it rules out."
        labels={{ more: "How we hire for it" }}
        values={[
          {
            name: "Own the outcome",
            meaning: "We are measured on whether the customer’s problem is gone, not on whether our ticket is closed.",
            does: "Stay on a customer issue until the customer confirms it is fixed, even when the fix lands in another team’s code.",
            doesNot: "Mark something resolved on our side while the customer is still waiting for it to work.",
            href: "#own-the-outcome",
          },
          {
            name: "Say the hard thing early",
            meaning: "Bad news does not improve with age, so we share it while there is still time to act on it.",
            does: "Flag a slipping deadline in the team channel the day you see it, with what you need to fix it.",
            doesNot: "Wait for the status meeting to mention that a release is at risk.",
            href: "#say-the-hard-thing",
          },
          {
            name: "Make it boring to run",
            meaning: "The best systems are the ones nobody has to think about at three in the morning.",
            does: "Write the runbook and add the alert in the same pull request as the feature.",
            doesNot: "Ship something that only its author knows how to restart.",
            href: "#boring-to-run",
          },
          {
            name: "Leave it clearer",
            meaning: "Everyone who touches something should leave it a little easier for the next person.",
            does: "Fix the stale comment, the broken link or the confusing name you tripped over while you were there.",
            doesNot: "Walk past a broken window and say it was not in your ticket.",
            href: "#leave-it-clearer",
          },
        ]}
      />

      <div className="mt-24 border-t border-border pt-12">
        <p className="mb-10 text-xs text-muted-foreground">Three values, one level lower on the page and no links</p>
        <ValuesRows
          headingLevel={3}
          title="What our members can expect"
          values={[
            {
              name: "Honest programmes",
              meaning: "We tell you what a plan can and cannot do in twelve weeks.",
              does: "Show the average result of our members, including the ones who stopped.",
              doesNot: "Promise a body or a number in a month.",
            },
            {
              name: "Coaches who stay",
              meaning: "You should not have to explain your knee to a new person every term.",
              does: "Keep the same coach with you for at least a year, and say so before you join.",
              doesNot: "Rotate staff to cover the timetable and hope nobody notices.",
            },
            {
              name: "Easy to leave",
              meaning: "People stay because it works for them, not because cancelling is hard.",
              does: "Let you cancel in the app in under a minute, with the last day clear.",
              doesNot: "Ask you to write a letter, or to call during office hours.",
            },
          ]}
        />
      </div>
    </div>
  );
}
