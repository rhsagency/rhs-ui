import { GlossarySection } from "@rhs-ui/marketing/glossary-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6">
      <GlossarySection
        title="Glossary"
        description="The words we use, and what we mean by them."
        terms={[
          { term: "Backlog", definition: "Work that is agreed to be worth doing, in order, but not yet planned into a cycle." },
          { term: "Burn-down", definition: "A chart of the work left in a cycle against the days left, to see early whether it will fit." },
          { term: "Cycle", definition: "A fixed stretch of time, usually two weeks, that the team plans and reviews as one." },
          { term: "Decision log", definition: "A dated list of what was decided, by whom and why, linked to the work it affects." },
          { term: "Milestone", definition: "A point on the roadmap that marks something shipped, not a date that passed." },
          { term: "Roadmap", definition: "The order in which outcomes will be pursued, reviewed every quarter." },
          { term: "Scope", definition: "What a piece of work includes, and just as important, what it leaves out." },
        ]}
      />
    </div>
  );
}
