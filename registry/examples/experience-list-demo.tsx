import { ExperienceList, type ExperienceEntry } from "@rhs-ui/application/experience-list";

// A fixed "now" keeps "4 yrs 7 mos" the same on every load. In an app, leave `now` out and the list reads the browser's clock.
const NOW = Date.parse("2026-10-29T15:20:00Z");

/** A logo tile drawn in flat shapes, with its own ground so it reads on both themes. Use real logos in an app. */
const mark = (ground: string, ink: string, shape: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='18' fill='${ground}'/>${shape.replaceAll("INK", ink)}</svg>`);

const HALCYON = mark("#1f2328", "#f1efe9", "<rect x='27' y='26' width='11' height='44' rx='2' fill='INK'/><rect x='58' y='26' width='11' height='44' rx='2' fill='INK'/><rect x='27' y='42' width='42' height='11' fill='INK'/>");
const KESTREL = mark("#e6e3dc", "#2f3236", "<path d='M24 62 48 32 72 62' fill='none' stroke='INK' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'/><circle cx='48' cy='70' r='5' fill='INK'/>");

const WORK: readonly ExperienceEntry[] = [
  {
    role: "Engineering Manager",
    organisation: "Halcyon Freight",
    logo: HALCYON,
    start: "2023-04",
    location: "Rotterdam, Netherlands",
    bullets: ["Lead nine engineers across routing, billing and the driver app.", "Cut the time to ship a change from nine days to two by moving to trunk-based development."],
    skills: ["Team leadership", "Roadmapping", "TypeScript"],
  },
  {
    role: "Senior Software Engineer",
    organisation: "Halcyon Freight",
    logo: HALCYON,
    start: "2019-01",
    end: "2023-03",
    location: "Rotterdam, Netherlands",
    bullets: ["Rebuilt the route planner on a graph engine; delivery windows now hold 97 percent of the time.", "Mentored four engineers to senior."],
    skills: ["Go", "PostgreSQL", "Kafka"],
  },
  {
    role: "Software Engineer",
    organisation: "Kestrel Labs",
    logo: KESTREL,
    start: "2016-09",
    end: "2018-12",
    location: "Berlin, Germany",
    bullets: ["Built the first carbon-reporting dashboard, used by 40 customers within a year."],
    skills: ["React", "Python"],
  },
  {
    role: "Junior Developer",
    organisation: "Larkspur Studio",
    start: "2014-06",
    end: "2016-08",
    location: "Utrecht, Netherlands",
    bullets: ["Shipped marketing sites for twelve small clients, from the first sketch to launch."],
    skills: ["JavaScript", "CSS"],
  },
];

const EDUCATION: readonly ExperienceEntry[] = [
  {
    role: "Certificate in Service Design",
    organisation: "Polder Institute",
    start: "2020-01",
    end: "2020-06",
    location: "Amsterdam, Netherlands",
    bullets: ["Evening programme next to a full-time job; final project on onboarding for new drivers."],
  },
  {
    role: "MSc Human-Computer Interaction",
    organisation: "Lindenhoff University",
    start: "2012-09",
    end: "2014-06",
    location: "Utrecht, Netherlands",
    bullets: ["Thesis on voice interfaces for drivers, graded 9 out of 10."],
    skills: ["Research", "Prototyping"],
  },
  {
    role: "BSc Computer Science",
    organisation: "Lindenhoff University",
    start: "2009-09",
    end: "2012-06",
    location: "Utrecht, Netherlands",
    bullets: ["Graduated with honours; chair of the student robotics club in the final year."],
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-12">
      <section aria-labelledby="experience-heading">
        <h2 id="experience-heading" className="mb-6 text-lg font-semibold tracking-[-0.02em]">
          Experience
        </h2>
        <ExperienceList entries={WORK} now={NOW} headingLevel={3} aria-labelledby="experience-heading" />
      </section>
      <section aria-labelledby="education-heading">
        <h2 id="education-heading" className="mb-6 text-lg font-semibold tracking-[-0.02em]">
          Education
        </h2>
        <ExperienceList entries={EDUCATION} variant="education" now={NOW} headingLevel={3} aria-labelledby="education-heading" />
      </section>
    </div>
  );
}
