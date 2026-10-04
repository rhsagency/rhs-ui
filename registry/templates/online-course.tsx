"use client";
import { useState } from "react";

import { SketchLines } from "@rhs-ui/backgrounds/sketch-lines";
import { Rating } from "@rhs-ui/primitives/rating";
import { IconCheck, IconClock, IconPlay, IconVideo } from "@rhs-ui/icons";
import { FaqSection } from "@rhs-ui/marketing/faq-section";
import { TestimonialGrid, type Testimonial } from "@rhs-ui/marketing/testimonial-grid";
import { Reveal } from "@rhs-ui/motion/reveal";
import { ScrollProgress } from "@rhs-ui/motion/scroll-progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@rhs-ui/primitives/accordion";
import { Button } from "@rhs-ui/primitives/button";

export interface CourseModule { id: string; title: string; lessons: readonly { title: string; minutes: number; preview?: boolean }[] }

export interface OnlineCourseProps {
  title?: string;
  teacher?: { name: string; bio: string };
  price?: string;
  modules?: readonly CourseModule[];
  onEnrol?: () => Promise<void> | void;
}

const MODULES: CourseModule[] = [
  { id: "m1", title: "Seeing interfaces", lessons: [{ title: "Why most screens feel busy", minutes: 9, preview: true }, { title: "Hierarchy with type alone", minutes: 14 }, { title: "Spacing as a system", minutes: 17 }] },
  { id: "m2", title: "Components that last", lessons: [{ title: "The five states of a button", minutes: 12 }, { title: "Forms people finish", minutes: 21 }, { title: "Empty, loading, error", minutes: 16 }] },
  { id: "m3", title: "Motion with meaning", lessons: [{ title: "When to animate, and when not", minutes: 11, preview: true }, { title: "Scroll-driven stories", minutes: 19 }, { title: "Reduced motion done right", minutes: 8 }] },
  { id: "m4", title: "Shipping the work", lessons: [{ title: "Design reviews that decide", minutes: 13 }, { title: "Handing off without losing it", minutes: 15 }, { title: "Final project", minutes: 40 }] },
];

const TESTIMONIALS: Testimonial[] = [
  { id: "a", quote: "I redesigned our settings page in the week after module two. Support tickets about it dropped by half.", name: "Julia Novak", role: "Product designer" },
  { id: "b", quote: "Finally a course that talks about states and edge cases instead of dribbble shots.", name: "Marco Rossi", role: "Front-end engineer" },
  { id: "c", quote: "Short lessons, real examples, and feedback on the final project. Worth every euro.", name: "Chloé Martin", role: "Founder" },
];

/**
 * A course sales page: a sketched hero with the promise and the numbers, a
 * reading progress bar, the curriculum as modules with lesson times and free
 * previews, the teacher, reviews, one price, and questions.
 */
export function OnlineCourse({ title = "Interface Craft", teacher = { name: "Eva Lindqvist", bio: "Twelve years designing products at Spotify, Linear and her own studio. She has taught 9,000 designers and engineers to make interfaces that feel obvious." }, price = "€249", modules = MODULES, onEnrol }: OnlineCourseProps): React.JSX.Element {
  const [enrolled, setEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);
  const lessons = modules.flatMap((module) => module.lessons);
  const hours = Math.round((lessons.reduce((sum, lesson) => sum + lesson.minutes, 0) / 60) * 10) / 10;
  const enrol = async () => {
    setBusy(true);
    await onEnrol?.();
    setBusy(false);
    setEnrolled(true);
  };
  return (
    <div data-slot="online-course" className="bg-background text-foreground">
      <ScrollProgress className="fixed inset-x-0 top-0 z-50" />
      <SketchLines className="border-b border-border [&>canvas]:opacity-40" speed={0.25}>
        <nav aria-label="Course" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <a href="#course-top" className="text-lg font-semibold tracking-tight">{title}</a>
          <a href="#course-enrol" className="rounded-full bg-foreground px-4 py-2 text-sm text-background">Enrol · {price}</a>
        </nav>
        <header id="course-top" className="mx-auto max-w-4xl px-6 pt-16 pb-24 text-center sm:px-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
            <IconVideo size={14} /> Online course · new cohort in October
          </p>
          <h1 className="mt-8 text-5xl font-semibold leading-[1] tracking-[-0.05em] sm:text-7xl">Design interfaces that feel obvious.</h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {lessons.length} short lessons on hierarchy, components, motion and shipping, with feedback on a real project at the end.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href="#course-enrol" className="rounded-full bg-foreground px-6 py-3 text-sm text-background">Enrol now</a>
            <a href="#course-curriculum" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm">
              <IconPlay size={14} /> Watch a free lesson
            </a>
          </div>
          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-border pt-8">
            {[["Lessons", String(lessons.length)], ["Hours", String(hours)], ["Students", "9,000+"]].map(([term, value]) => (
              <div key={term}>
                <dt className="text-xs text-muted-foreground">{term}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </header>
      </SketchLines>

      <section id="course-curriculum" className="mx-auto max-w-4xl scroll-mt-6 px-6 py-24 sm:px-10">
        <Reveal>
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Curriculum</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Four modules, one project.</h2>
        </Reveal>
        <Accordion type="multiple" defaultValue={[modules[0]?.id ?? ""]} className="mt-10">
          {modules.map((module, index) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger>
                <span className="flex items-baseline gap-4 text-left">
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  <span className="text-lg">{module.title}</span>
                  <span className="text-xs text-muted-foreground">{module.lessons.length} lessons</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="grid gap-1 pb-2">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.title} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                      <IconPlay size={14} className="text-muted-foreground" />
                      <span className="flex-1">{lesson.title}</span>
                      {lesson.preview ? <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase">Free preview</span> : null}
                      <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground"><IconClock size={12} /> {lesson.minutes} min</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:px-10 md:grid-cols-[auto_1fr] md:items-center">
          <Reveal>
            <span aria-hidden="true" className="grid size-40 place-items-center rounded-full bg-background text-4xl font-semibold tracking-tight shadow-sm">{teacher.name.split(" ").map((part) => part[0]).join("")}</span>
          </Reveal>
          <Reveal order={1}>
            <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Your teacher</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{teacher.name}</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{teacher.bio}</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <Reveal className="grid gap-10 lg:grid-cols-2 lg:items-end">
          <h2 className="text-4xl font-semibold tracking-[-0.04em]">Rated 4.8 by 700 students.</h2>
          <div className="grid gap-2 lg:justify-self-end"><Rating value={4.8} readOnly size={28} label="Rated 4.8 out of 5" /><p className="text-sm text-muted-foreground">612 five-star and 71 four-star reviews, from 700 students.</p></div>
        </Reveal>
        <Reveal order={1} className="mt-4">
          <TestimonialGrid eyebrow="Reviews" title="What students say." testimonials={TESTIMONIALS} featured="a" />
        </Reveal>
      </section>

      <section id="course-enrol" className="mx-auto max-w-3xl scroll-mt-6 px-6 py-16 sm:px-10">
        <Reveal effect="scale" className="rounded-3xl bg-foreground p-10 text-center text-background sm:p-14">
          <p className="font-mono text-[11px] tracking-widest uppercase opacity-60">One payment, lifetime access</p>
          <p className="mt-6 text-7xl font-semibold tracking-tight">{price}</p>
          <ul className="mx-auto mt-8 grid max-w-sm gap-3 text-left text-sm">
            {["All lessons and future updates", "Feedback on your final project", "Certificate of completion", "30-day refund, no questions"].map((line) => (
              <li key={line} className="flex items-center gap-3"><IconCheck size={16} /> {line}</li>
            ))}
          </ul>
          {enrolled ? (
            <p role="status" className="mt-10 text-sm">You are in. Check your inbox for the first lesson.</p>
          ) : (
            <Button size="lg" variant="secondary" loading={busy} onClick={() => void enrol()} className="mt-10 rounded-full">Enrol now</Button>
          )}
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 sm:px-10">
        <FaqSection
          questions={[
            { id: "level", question: "Is it for beginners?", answer: "It is for people who already build or design interfaces and want them to be clearer. No specific tool is required." },
            { id: "time", question: "How much time does it take?", answer: `About ${hours} hours of video plus the project. Most people finish in four to six weeks.` },
            { id: "team", question: "Can my team join?", answer: "Yes, teams of five or more get 20% off and a shared review session." },
          ]}
        />
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl justify-between px-6 py-8 text-xs text-muted-foreground sm:px-10">
          <span>© 2026 {title}</span>
          <span>Made by {teacher.name}</span>
        </div>
      </footer>
    </div>
  );
}
