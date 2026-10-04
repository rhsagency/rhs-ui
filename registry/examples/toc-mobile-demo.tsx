import { TocMobile } from "@rhs-ui/primitives/toc-mobile";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md p-6">
      <TocMobile
        items={[
          { id: "why", title: "Why quiet matters", level: 2 },
          { id: "pings", title: "The cost of a ping", level: 3 },
          { id: "summary", title: "The Monday summary", level: 3 },
          { id: "how", title: "How we built it", level: 2 },
          { id: "next", title: "What comes next", level: 2 },
        ]}
      />
    </div>
  );
}
