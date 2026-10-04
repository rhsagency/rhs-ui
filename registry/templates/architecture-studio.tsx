import { ArchitectGrid } from "@rhs-ui/backgrounds/architect-grid";
import { IconArrowUpRight, IconMail, IconPin } from "@rhs-ui/icons";
import { FooterMinimal } from "@rhs-ui/marketing/footer-minimal";
import { ProcessSection } from "@rhs-ui/marketing/process-section";
import { TeamGrid } from "@rhs-ui/marketing/team-grid";
import { TimelineSection } from "@rhs-ui/marketing/timeline-section";
import { Reveal } from "@rhs-ui/motion/reveal";
import { TextReveal } from "@rhs-ui/motion/text-reveal";

export interface ArchitectureStudioProps {
  name?: string;
}

const plan = (shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 560'><rect width='800' height='560' fill='#e6e3dd'/>${shape}</svg>`);

const PROJECTS = [
  { id: "1", title: "House on the dike", place: "Zeeland, 2025", image: plan("<path d='M150 400 L400 180 L650 400Z' fill='#3b3e42'/><rect x='150' y='400' width='500' height='60' fill='#8b857a'/>") },
  { id: "2", title: "Library extension", place: "Deventer, 2024", image: plan("<rect x='160' y='160' width='220' height='280' fill='#3b3e42'/><rect x='380' y='240' width='260' height='200' fill='#8b857a'/>") },
  { id: "3", title: "Courtyard housing", place: "Rotterdam, 2023", image: plan("<rect x='140' y='140' width='520' height='300' fill='none' stroke='#3b3e42' stroke-width='40'/>") },
  { id: "4", title: "Boathouse", place: "Loosdrecht, 2022", image: plan("<path d='M120 380 H680 L600 260 H200Z' fill='#3b3e42'/>") },
];

/**
 * An architecture practice: a grid-paper opening, a statement that reveals
 * as you read, projects as large plates, how a commission runs, the studio's
 * history and its people. Typographic, slow and spacious.
 */
export function ArchitectureStudio({ name = "Atelier Veld" }: ArchitectureStudioProps): React.JSX.Element {
  return (
    <div data-slot="architecture-studio" className="bg-background text-foreground">
      <ArchitectGrid className="border-b border-border">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm">
          <a href="#top" className="font-medium tracking-[0.2em] uppercase">{name}</a>
          <nav aria-label="Main" className="flex gap-6 text-muted-foreground"><a href="#projects">Projects</a><a href="#studio">Studio</a><a href="#contact">Contact</a></nav>
        </header>
        <section id="top" className="mx-auto max-w-6xl px-6 pt-24 pb-32">
          <h1 className="max-w-5xl text-6xl font-light leading-[1.02] tracking-[-0.04em] sm:text-8xl">Buildings that age well.</h1>
          <p className="mt-8 max-w-md text-muted-foreground">An architecture practice in Amsterdam: homes, libraries and small public buildings, designed to be loved for a hundred years.</p>
        </section>
      </ArchitectGrid>
      <section className="mx-auto max-w-4xl px-6 py-28">
        <TextReveal as="p" className="text-center text-3xl leading-snug font-light tracking-tight sm:text-4xl" text="We draw slowly, build with what the place already has, and leave room for the people who will change the building after us." />
      </section>
      <section id="projects" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-10 text-xs uppercase tracking-[0.2em] text-muted-foreground">Selected projects</h2>
        <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {PROJECTS.map((project, index) => (
            <Reveal asChild key={project.id} order={index % 2}>
              <li className={index % 2 ? "md:mt-24" : ""}>
                <a href="#contact" className="group block">
                  <img src={project.image} alt={`${project.title}, ${project.place}`} className="aspect-[10/7] w-full object-cover" />
                  <span className="mt-4 flex items-baseline justify-between gap-4">
                    <span className="text-xl font-light tracking-tight group-hover:underline group-hover:underline-offset-4">{project.title}</span>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">{project.place}<IconArrowUpRight size={14} /></span>
                  </span>
                </a>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-6">
          <ProcessSection title="How a commission runs" steps={[{ id: "listen", title: "Listen", description: "Weeks on site before a line is drawn." }, { id: "sketch", title: "Sketch", description: "Three directions, by hand, in a model." }, { id: "detail", title: "Detail", description: "Every junction drawn, with the builder at the table." }, { id: "build", title: "Build", description: "On site weekly until the keys are handed over." }]} />
        </div>
      </section>
      <div id="studio" className="mx-auto max-w-6xl px-6">
        <TimelineSection eyebrow="The studio" title="Twenty years, forty buildings" milestones={[{ when: "2006", title: "Founded", description: "Two architects in a canal house attic." }, { when: "2014", title: "First public building", description: "A library in Deventer, still our favourite." }, { when: "2023", title: "Twelve people", description: "Architects, a model maker and an engineer." }, { when: "2027", title: "A school", description: "Our first school, in timber.", upcoming: true }]} />
        <TeamGrid title="The people" members={[{ id: "1", name: "Ilse Veld", role: "Founding architect" }, { id: "2", name: "Bram de Jong", role: "Architect" }, { id: "3", name: "Yara Haddad", role: "Model maker" }, { id: "4", name: "Kees Mulder", role: "Structural engineer" }]} />
      </div>
      <section id="contact" className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-2">
          <h2 className="text-4xl font-light tracking-tight">Have a site in mind?</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><IconMail size={16} /><a href="mailto:studio@example.com" className="underline underline-offset-4">studio@example.com</a></li>
            <li className="flex items-center gap-2"><IconPin size={16} />Prinsengracht 200, Amsterdam</li>
          </ul>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-6"><FooterMinimal brand={<span className="tracking-[0.2em] uppercase">{name}</span>} links={[{ label: "Projects", href: "#projects" }, { label: "Studio", href: "#studio" }]} legal={`© 2026 ${name}. Illustrative template.`} /></div>
    </div>
  );
}
