"use client";

import { useRef, useState } from "react";

import { ProjectCard, ProjectCardSkeleton, type ProjectCardAction, type ProjectCardProject } from "@rhs-ui/application/project-card";
import { IconArchive, IconBook, IconCopy, IconEdit, IconGlobe, IconServer, IconSmartphone, IconTrash, IconUndo } from "@rhs-ui/icons";

// A fixed "now" keeps the due dates the same on every load. In an app, leave `now` out and the cards read the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");

const START: readonly ProjectCardProject[] = [
  {
    id: "northwind",
    name: "Northwind redesign",
    description: "Rebuild of the marketing site on the new design system, with a faster checkout and Dutch and German copy.",
    status: "active",
    progress: 68,
    due: "2026-11-14",
    icon: <IconGlobe />,
    href: "/projects/northwind",
    members: [{ name: "Mara Okafor" }, { name: "Leo Martins" }, { name: "Sofia Rossi" }, { name: "Priya Nair" }, { name: "Dan Cho" }, { name: "Hana Sato" }],
  },
  {
    id: "larkspur",
    name: "Larkspur brand",
    description: "Logo, colour and tone of voice for the spring launch.",
    status: "planning",
    progress: 8,
    due: "2026-12-12",
    href: "/projects/larkspur",
    members: [{ name: "Sofia Rossi" }, { name: "Mara Okafor" }],
  },
  {
    id: "kestrel",
    name: "Kestrel mobile app",
    description: "iOS and Android app for planning trips, with offline maps and push reminders.",
    status: "completed",
    progress: 100,
    due: "2026-10-24",
    completedAt: "2026-10-21T16:05:00Z",
    icon: <IconSmartphone />,
    href: "/projects/kestrel",
    members: [{ name: "Leo Martins" }, { name: "Dan Cho" }, { name: "Tomas Brandt" }],
  },
  {
    id: "suppliers",
    name: "Supplier onboarding guide",
    description: "A step-by-step guide for new suppliers, waiting on the legal review of the data processing terms.",
    status: "on-hold",
    progress: 55,
    due: "2026-10-24",
    icon: <IconBook />,
    href: "/projects/suppliers",
    members: [{ name: "Hana Sato" }, { name: "Ines Kowalski" }],
  },
  {
    id: "intranet",
    name: "Intranet migration",
    description: "Move every team page to the new CMS and retire the old servers.",
    status: "archived",
    progress: 100,
    due: "2026-09-30",
    icon: <IconServer />,
    href: "/projects/intranet",
    members: [{ name: "Leo Martins" }, { name: "Priya Nair" }, { name: "Dan Cho" }],
  },
];

export default function Demo(): React.JSX.Element {
  const [projects, setProjects] = useState(START);
  const [starred, setStarred] = useState<ReadonlySet<string>>(new Set(["northwind"]));
  const grid = useRef<HTMLDivElement>(null);
  const setStatus = (id: string, status: ProjectCardProject["status"]) => setProjects((list) => list.map((project) => (project.id === id ? { ...project, status } : project)));

  function remove(id: string) {
    setProjects((list) => list.filter((project) => project.id !== id));
    // The card that had focus is gone: focus moves to the first card left, not to the top of the page.
    requestAnimationFrame(() => (grid.current?.querySelector<HTMLElement>("[data-slot=project-card-open]") ?? grid.current)?.focus());
  }

  const menu = (project: ProjectCardProject): readonly ProjectCardAction[] => [
    { id: "rename", label: "Rename", icon: <IconEdit />, onSelect: () => undefined },
    { id: "duplicate", label: "Duplicate", icon: <IconCopy />, onSelect: () => undefined },
    project.status === "archived"
      ? { id: "restore", label: "Restore", icon: <IconUndo />, onSelect: () => setStatus(project.id, "active") }
      : { id: "archive", label: "Archive", icon: <IconArchive />, onSelect: () => setStatus(project.id, "archived") },
    { id: "delete", label: "Delete", icon: <IconTrash />, destructive: true, onSelect: () => remove(project.id) },
  ];

  return (
    <div ref={grid} tabIndex={-1} className="grid w-full max-w-4xl grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4 outline-none">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          now={NOW}
          menu={menu(project)}
          starred={starred.has(project.id)}
          onStar={(next) =>
            setStarred((current) => {
              const copy = new Set(current);
              if (next) copy.add(project.id);
              else copy.delete(project.id);
              return copy;
            })
          }
          onOpen={(_project, event) => {
            // A preview has nowhere to go: a router would navigate here.
            event.preventDefault();
          }}
        />
      ))}
      <ProjectCardSkeleton />
    </div>
  );
}
