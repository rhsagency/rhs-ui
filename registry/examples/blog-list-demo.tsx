import { BlogList } from "@rhs-ui/marketing/blog-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6">
      <BlogList
        title="Writing"
        posts={[
          { href: "#four-day-week", title: "What happened when we closed on Fridays", excerpt: "Six months of a four-day week, measured in releases, sick days and support tickets.", category: "Culture", date: "12 March 2026", dateTime: "2026-03-12", readingTime: "8 min" },
          { href: "#decision-log", title: "The decision log that outlived three reorgs", excerpt: "Why the most useful document we have is a list of things we decided not to do.", category: "Process", date: "26 February 2026", dateTime: "2026-02-26", readingTime: "5 min" },
          { href: "#search", title: "Moving search to Postgres saved us a vendor", excerpt: "A practical write-up of full-text search, ranking and the one index that mattered.", category: "Engineering", date: "9 February 2026", dateTime: "2026-02-09", readingTime: "11 min" },
        ]}
      />
    </div>
  );
}
