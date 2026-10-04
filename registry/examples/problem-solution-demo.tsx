import { ProblemSolution } from "@rhs-ui/marketing/problem-solution";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6">
      <ProblemSolution
        title="From status meetings to shipped work."
        rows={[
          { before: "A Monday meeting to find out where things stand", after: "Status is on the roadmap, always current" },
          { before: "Decisions buried in chat threads", after: "A decision log next to the work it changed" },
          { before: "Release notes written from memory", after: "Notes drafted from the finished tasks" },
          { before: "Clients emailing for updates", after: "A read-only link that answers them" },
        ]}
      />
    </div>
  );
}
