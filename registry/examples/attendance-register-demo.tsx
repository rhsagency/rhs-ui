"use client";

import { useState, type ReactNode } from "react";

import { AttendanceRegister, type AttendanceMarks, type AttendancePerson, type AttendanceSession } from "@rhs-ui/application/attendance-register";

// Fixed, so the demo reads the same today and next year: which session is today, and which are still to come, is measured from here.
// Monday morning, the day of the fifth session.
const NOW = "2026-11-09T09:30:00Z";
const ZONE = "Europe/Amsterdam";

const PEOPLE: readonly AttendancePerson[] = [
  { id: "mara", name: "Mara Visser" },
  { id: "tom", name: "Tom Jansen" },
  { id: "priya", name: "Priya Nair" },
  { id: "hana", name: "Hana Okafor" },
  { id: "joost", name: "Joost de Boer" },
  { id: "sofia", name: "Sofia Alvarez" },
  { id: "liam", name: "Liam Walsh" },
  { id: "noor", name: "Noor Haddad" },
];

const SESSIONS: readonly AttendanceSession[] = [
  { id: "s1", date: "2026-10-12", title: "Type scales" },
  { id: "s2", date: "2026-10-19", title: "Hierarchy and rhythm" },
  { id: "s3", date: "2026-10-26", title: "Grids and columns" },
  { id: "s4", date: "2026-11-02", title: "Pairing typefaces" },
  { id: "s5", date: "2026-11-09", title: "Web type" },
  { id: "s6", date: "2026-11-16", title: "Variable fonts" },
  { id: "s7", date: "2026-11-23", title: "Critique day" },
  { id: "s8", date: "2026-11-30", title: "Final review" },
];

// Four people are still unmarked today, so the button on today's column offers to mark the rest.
const MARKS: AttendanceMarks = {
  mara: { s1: "present", s2: "present", s3: "present", s4: "present", s5: "present" },
  tom: { s1: "present", s2: "late", s3: "present", s4: "absent" },
  priya: { s1: "present", s2: "present", s3: "excused", s4: "present", s5: "present" },
  hana: { s1: "late", s2: "present", s3: "absent", s4: "present" },
  joost: { s1: "present", s2: "absent", s3: "absent", s4: "late" },
  sofia: { s1: "present", s2: "present", s3: "present", s4: "present", s5: "present" },
  liam: { s1: "present", s2: "present", s3: "late", s4: "present" },
  noor: { s1: "excused", s2: "present", s3: "present", s4: "present", s5: "present" },
};

function Section({ title, summary, children }: { title: string; summary: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1.5 mb-5 max-w-2xl text-sm text-muted-foreground">{summary}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [marks, setMarks] = useState<AttendanceMarks>(MARKS);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-10 sm:px-6">
      <Section
        title="Typography II, autumn term"
        summary="Click a cell, or focus it and press P, L, A or E. Rest present marks everyone who has no mark yet today; a mark that was set on purpose is never overwritten. The three sessions to come are disabled."
      >
        <AttendanceRegister
          people={PEOPLE}
          sessions={SESSIONS}
          marks={marks}
          onMarkChange={(_, next) => setMarks(next)}
          now={NOW}
          timeZone={ZONE}
          locale="en-GB"
          labels={{ caption: "Attendance register, Typography II" }}
        />
      </Section>

      <div className="max-w-4xl">
        <Section title="Read only" summary="The same register for a report: plain marks, no menus and no buttons. Each mark still has a glyph and a word, and every cell is named in full.">
          <AttendanceRegister
            people={PEOPLE.slice(0, 4)}
            sessions={SESSIONS.slice(0, 4)}
            defaultMarks={MARKS}
            readOnly
            now={NOW}
            timeZone={ZONE}
            locale="en-GB"
            labels={{ caption: "Attendance report, first four sessions" }}
          />
        </Section>
      </div>
    </div>
  );
}
