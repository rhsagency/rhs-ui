import { Button } from "@rhs-ui/primitives/button";
import { JobDetail } from "@rhs-ui/marketing/job-detail";

export default function Demo(): React.JSX.Element {
  return (
    <div className="px-6">
      <JobDetail
        titleAs="h2"
        title="Senior product designer"
        team="Design"
        location="Utrecht or remote in the EU"
        hours="Full-time, 32 to 40 hours"
        salary="€4,800 to €6,000 a month"
        intro="We are looking for a designer who likes calm software and the hard work it takes to make something simple."
        sections={[
          { title: "What you will do", points: ["Own the design of planning and reporting, from research to release.", "Work in a team of four with two engineers and a PM.", "Write down your decisions; we read them."] },
          { title: "What you bring", points: ["Five or more years designing software people use daily.", "Examples of work you would defend in detail.", "Comfort with saying no to features."] },
          { title: "What we offer", points: ["A four-day week option.", "€1,500 a year for learning.", "Thirty days of holiday."] },
        ]}
        apply={<Button size="lg">Apply in 5 minutes</Button>}
        contact={<>Questions? Write to <a href="mailto:jobs@example.com">jobs@example.com</a>.</>}
      />
    </div>
  );
}
