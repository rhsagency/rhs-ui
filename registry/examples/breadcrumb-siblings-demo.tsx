"use client";

import { useState, type ReactNode } from "react";

import { BreadcrumbSiblings, type BreadcrumbSiblingsItem } from "@rhs-ui/primitives/breadcrumb-siblings";

const PROJECTS = ["Northwind", "Halcyon", "Kestrel", "Meridian", "Aurora Labs", "Brightwater", "Cobalt", "Driftwood", "Evergreen", "Foxglove", "Garnet", "Harbour", "Ironwood", "Juniper", "Kingfisher", "Lumen", "Marlowe", "Nightjar"].map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, "-") }));

const AREAS = [
  { label: "Projects", href: "/projects" },
  { label: "Teams", href: "/teams" },
  { label: "Usage", href: "/usage" },
  { label: "Billing", href: "/billing" },
];

const SECTIONS = [
  { label: "Overview", href: "overview" },
  { label: "Deployments", href: "deployments" },
  { label: "Analytics", href: "analytics" },
  { label: "Settings", href: "settings" },
  { label: "Members", href: "members" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Header({ children, title, text }: { children: ReactNode; title: string; text: string }): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card px-3 py-4 text-card-foreground sm:px-5">
      {children}
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/** The trail of a project's settings. Choosing a project in the menu changes the project and keeps the page. */
function Settings(): React.JSX.Element {
  const [slug, setSlug] = useState("northwind");
  const [opened, setOpened] = useState("/projects/northwind/settings");
  const project = PROJECTS.find((entry) => entry.slug === slug) ?? PROJECTS[0];
  if (!project) return <></>;
  const items: BreadcrumbSiblingsItem[] = [
    { label: "Projects", href: "/projects", siblings: AREAS },
    { label: project.name, href: `/projects/${project.slug}`, siblings: PROJECTS.map((entry) => ({ label: entry.name, href: `/projects/${entry.slug}` })) },
    { label: "Settings", href: `/projects/${project.slug}/settings` },
  ];
  return (
    <div className="grid gap-3">
      <Header title={`${project.name} settings`} text="Domains, environment variables and who can deploy.">
        <BreadcrumbSiblings
          aria-label="Breadcrumb, project settings"
          items={items}
          onNavigate={(href) => {
            const match = /^\/projects\/([^/]+)$/.exec(href);
            if (match?.[1]) setSlug(match[1]);
            setOpened(match ? `${href}/settings` : href);
          }}
        />
      </Header>
      <p role="status" className="text-xs text-muted-foreground tabular-nums">
        Opened {opened}
      </p>
    </div>
  );
}

/** The same trail, with the current page's siblings too: Settings opens Overview, Deployments and the rest. */
function Current(): React.JSX.Element {
  const [section, setSection] = useState("deployments");
  const label = SECTIONS.find((entry) => entry.href === section)?.label ?? "Overview";
  const items: BreadcrumbSiblingsItem[] = [
    { label: "Projects", href: "/projects", siblings: AREAS },
    { label: "Kestrel", href: "/projects/kestrel", siblings: PROJECTS.slice(0, 5).map((entry) => ({ label: entry.name, href: `/projects/${entry.slug}` })) },
    { label, href: `/projects/kestrel/${section}`, siblings: SECTIONS.map((entry) => ({ label: entry.label, href: `/projects/kestrel/${entry.href}` })) },
  ];
  return (
    <Header title={label} text="The last crumb has a menu too: move to a sibling page in one step.">
      <BreadcrumbSiblings aria-label="Breadcrumb, project page" items={items} onNavigate={(href) => setSection(href.split("/").pop() ?? "overview")} />
    </Header>
  );
}

const DEEP: BreadcrumbSiblingsItem[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Northwind", href: "/projects/northwind" },
  { label: "Web app", href: "/projects/northwind/web" },
  { label: "Settings", href: "/projects/northwind/web/settings", siblings: SECTIONS.map((entry) => ({ label: entry.label, href: `/projects/northwind/web/${entry.href}` })) },
  { label: "Members", href: "/projects/northwind/web/settings/members" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-xl gap-10">
        <Example caption="Every level opens its siblings, the current one checked. The project list has 18 entries, so it gains a filter field.">
          <Settings />
        </Example>
        <Example caption="A crumb with siblings gets the chevron, the last one included.">
          <Current />
        </Example>
        <Example caption="A long trail keeps the first crumb and the last two (maxVisible 3), and folds the levels between them into a menu.">
          <div className="rounded-xl border border-border bg-card px-3 py-3.5 sm:px-5">
            <BreadcrumbSiblings aria-label="Breadcrumb, deep trail" items={DEEP} maxVisible={3} />
          </div>
        </Example>
      </div>
    </div>
  );
}
