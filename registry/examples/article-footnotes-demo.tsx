import { FootnoteList, FootnoteRef, Footnotes, type FootnoteNote } from "@rhs-ui/marketing/article-footnotes";

const notes: readonly FootnoteNote[] = [
  {
    id: "pilot",
    content: "The pilot ran from March to August 2026 across 38 firms, from a nine-person design studio to a 640-person logistics operator. Each firm chose its own day off.",
    source: { label: "Kestrel Institute, Four-Day Week Pilot: Method and Sample", href: "#kestrel-pilot", accessed: "2026-10-12" },
  },
  {
    id: "hours",
    content: "Thirty-one firms moved to 32 hours at full pay. Seven kept 36 hours and compressed the week into four longer days; they are reported separately and are not part of the averages below.",
  },
  {
    id: "sick-days",
    content: "Absence fell from 4.1 to 3.2 days per person across the six months, measured against the same months a year earlier. Firms with fewer than ten people saw the largest drop.",
    source: { label: "Halcyon Labour Review, Absence and Working Time, issue 14", href: "#halcyon-absence", accessed: "2026-10-09" },
    mentions: 2,
  },
  {
    id: "output",
    content: "Output was measured by each firm in its own way: invoices sent, tickets closed, orders shipped. We found no measure that works across all of them, so treat this as indicative.",
  },
  {
    id: "hiring",
    content: "Recruitment costs are taken from the firms' own accounts. Six firms declined to share them and are left out of this figure.",
    source: { label: "Northwind Staffing Panel, Cost of a Vacancy 2026", href: "#northwind-vacancy", accessed: "2026-10-14" },
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Follow a number: focus and a soft highlight land on the note, and the arrow takes you back to the exact sentence.</p>
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Working time</p>
      <h2 className="mt-4 text-4xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-5xl">A four-day week, six months in</h2>
      <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">What happened when 38 firms gave their people Fridays back, and what we can and cannot say about it yet.</p>

      <Footnotes notes={notes}>
        <div className="mt-10 grid gap-5 text-base leading-[1.75] text-foreground/90">
          <p>
            The easy version of this story is a headline: shorter weeks work. The real version is a spreadsheet with 38 rows, and most of the interesting findings sit in the way those rows differ.
            <FootnoteRef note="pilot" /> No two firms ran the same experiment, which is both the weakness of the pilot and the reason it is believable.
          </p>
          <p>
            Take the working week itself. Most firms cut to 32 hours without cutting pay, but a handful kept 36 hours and squeezed them into four days.
            <FootnoteRef note="hours" /> The second group is the one people picture when they hear &ldquo;four-day week&rdquo;, and it is the group with the least to report.
          </p>
          <p>
            The clearest result is absence. Across the pilot, people were off sick for almost a day less per person than in the same months a year before.
            <FootnoteRef note="sick-days" /> That is a small number with a large bill attached, which is why finance directors were the first to ask for a second phase.
          </p>
          <p>
            Output is harder. Every firm measured its own, and the honest summary is that none of them reported a fall.
            <FootnoteRef note="output" /> Hiring is the other surprise: vacancies were filled faster, and at a lower cost, in the firms that advertised the shorter week.
            <FootnoteRef note="hiring" /> Whether that survives the novelty is the question the second phase exists to answer, and the absence figures, again, are the ones to watch.
            <FootnoteRef note="sick-days" mention={2} />
          </p>
        </div>
        <FootnoteList className="mt-14" title="Notes and sources" locale="en-GB" />
      </Footnotes>
    </div>
  );
}
