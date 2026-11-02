"use client";

import { useState } from "react";

import { CurriculumList, type CurriculumModule } from "@rhs-ui/application/curriculum-list";

const MODULES: readonly CurriculumModule[] = [
  {
    id: "start",
    title: "1. Getting started",
    lessons: [
      { id: "welcome", title: "Welcome to the course", type: "video", minutes: 4, state: "completed", href: "#welcome" },
      { id: "how", title: "How the course works", type: "reading", minutes: 6, state: "completed", href: "#how" },
      { id: "tools", title: "Set up your tools", type: "video", minutes: 9, state: "completed", href: "#tools" },
    ],
  },
  {
    id: "type",
    title: "2. Working with type",
    lessons: [
      { id: "anatomy", title: "The anatomy of a typeface", type: "video", minutes: 14, state: "completed", href: "#anatomy" },
      { id: "pairing", title: "Choosing a pairing", type: "video", minutes: 11, state: "completed", href: "#pairing" },
      { id: "scales", title: "Type scales that hold up", type: "video", minutes: 16, href: "#scales" },
      { id: "rhythm", title: "Measure, leading and rhythm", type: "reading", minutes: 8, href: "#rhythm" },
      { id: "quiz-2", title: "Check yourself: scales and pairings", type: "quiz", minutes: 6, href: "#quiz-2" },
    ],
  },
  {
    id: "products",
    title: "3. Type in products",
    lessons: [
      { id: "variable", title: "Variable fonts in practice", type: "video", minutes: 12, state: "preview", href: "#variable" },
      { id: "dark", title: "Dark mode and contrast", type: "video", minutes: 10, state: "locked", reason: "Finish module 2 to unlock this lesson." },
      { id: "responsive", title: "Type that adapts to the screen", type: "reading", minutes: 9, state: "locked", reason: "Finish module 2 to unlock this lesson." },
      { id: "quiz-3", title: "Check yourself: type in products", type: "quiz", minutes: 7, state: "locked", reason: "Finish the lessons of this module first." },
    ],
  },
  {
    id: "project",
    title: "4. Final project",
    lessons: [
      { id: "brief", title: "The brief: a type system for Northwind", type: "reading", minutes: 15, state: "locked", reason: "Complete modules 2 and 3 to start the project." },
      { id: "review", title: "Peer review and feedback", type: "video", minutes: 20, state: "locked", reason: "Complete modules 2 and 3 to start the project." },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  const [current, setCurrent] = useState("scales");
  const [expanded, setExpanded] = useState<string[]>(["type", "products"]);
  const title = MODULES.flatMap((module) => module.lessons).find((lesson) => lesson.id === current)?.title;

  return (
    <div className="grid w-full max-w-2xl gap-5">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.02em]">Designing with type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {expanded.length} of {MODULES.length} modules open. Pressing a lesson makes it the current one; a locked lesson is not a link.
        </p>
      </div>
      <CurriculumList
        modules={MODULES}
        current={current}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onSelect={(lesson, _module, event) => {
          // A preview has nowhere to go: a router would navigate here.
          event.preventDefault();
          setCurrent(lesson.id);
        }}
      />
      <p role="status" className="text-xs text-muted-foreground">
        Now playing: {title}
      </p>
    </div>
  );
}
