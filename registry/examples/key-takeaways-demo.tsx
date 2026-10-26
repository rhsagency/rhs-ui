import { KeyTakeaways } from "@rhs-ui/marketing/key-takeaways";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Operations guide</p>
      <h2 className="mt-4 text-4xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-5xl">A planning session your team will not dread</h2>
      <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">Most quarterly planning fails in the first twenty minutes, long before anyone argues about the plan. This guide is about those twenty minutes.</p>

      <KeyTakeaways
        className="mt-10"
        points={[
          "Send the numbers two days ahead, so the meeting is for decisions and not for reading.",
          "Cap the agenda at three bets. Anything that does not fit is a candidate for next quarter.",
          "Give every bet one owner and one measure that someone outside the team could check.",
          "Write down what you decided not to do, and read that list out before you close.",
        ]}
        minutes={9}
        audience="team leads running their first planning cycle"
        jumps={[
          { label: "Before the session", href: "#before" },
          { label: "The agenda", href: "#agenda" },
          { label: "Following up", href: "#follow-up" },
        ]}
      />

      <p className="mt-10 text-base leading-[1.75] text-foreground/90">Planning has a reputation for being the meeting where good teams lose a day. It does not have to be. The teams we spoke to for this guide all run theirs in under two hours, and every one of them starts the same way: with the numbers already in everyone&rsquo;s hands.</p>

      <div className="mt-16 border-t border-border pt-10">
        <p className="mb-6 text-xs text-muted-foreground">A shorter summary with its own label and nothing in the footer but the reading time</p>
        <KeyTakeaways
          title="In short"
          headingLevel={3}
          points={[
            "A price rise is easier to accept when the reason is specific and the date is fixed.",
            "Tell existing customers first, in writing, at least 30 days ahead.",
            "Keep the old price for anyone who is mid-contract.",
          ]}
          minutes={4}
        />
      </div>
    </div>
  );
}
