"use client";

import { TableOfContents } from "@rhs-ui/primitives/table-of-contents";

const SECTIONS = [
  { id: "toc-install", title: "Install", level: 2 as const },
  { id: "toc-theme", title: "Add the theme", level: 2 as const },
  { id: "toc-tokens", title: "Tokens", level: 3 as const },
  { id: "toc-dark", title: "Dark mode", level: 3 as const },
  { id: "toc-first", title: "Your first component", level: 2 as const },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-3xl gap-8 p-8 sm:grid-cols-[1fr_12rem]">
      <article className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        {SECTIONS.map((section) => (
          <section key={section.id}>
            {section.level === 2 ? <h2 id={section.id} className="text-lg font-medium text-foreground">{section.title}</h2> : <h3 id={section.id} className="text-base font-medium text-foreground">{section.title}</h3>}
            <p className="mt-2">A short paragraph about {section.title.toLowerCase()}, standing in for the real documentation on this page.</p>
          </section>
        ))}
      </article>
      <aside className="sm:sticky sm:top-6 sm:self-start"><TableOfContents items={SECTIONS} /></aside>
    </div>
  );
}
