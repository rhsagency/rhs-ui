"use client";

import { useEffect, useRef, useState } from "react";

import { FormOutline, type OutlineSection } from "@rhs-ui/application/form-outline";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";

interface Field {
  id: string;
  label: string;
  kind?: "text" | "email" | "textarea" | "checkbox";
  required?: boolean;
  hint?: string;
}

interface Part {
  id: string;
  title: string;
  blurb: string;
  fields: readonly Field[];
}

const PARTS: readonly Part[] = [
  {
    id: "personal",
    title: "Personal details",
    blurb: "How we reach you about this application.",
    fields: [
      { id: "name", label: "Full name", required: true },
      { id: "email", label: "Email address", kind: "email", required: true },
      { id: "city", label: "City", required: true },
    ],
  },
  {
    id: "education",
    title: "Education",
    blurb: "Your most recent study, finished or not.",
    fields: [
      { id: "degree", label: "Degree or course", required: true },
      { id: "school", label: "School", required: true },
    ],
  },
  {
    id: "experience",
    title: "Work experience",
    blurb: "Your current or latest role, in a few lines.",
    fields: [
      { id: "role", label: "Job title", required: true },
      { id: "company", label: "Company", required: true },
      { id: "summary", label: "What you did there", kind: "textarea", required: true, hint: "Two or three sentences are plenty." },
    ],
  },
  {
    id: "portfolio",
    title: "Portfolio",
    blurb: "One link we can open, and a word about it.",
    fields: [
      { id: "link", label: "Portfolio link", required: true },
      { id: "about", label: "About the work", kind: "textarea" },
    ],
  },
  {
    id: "references",
    title: "References",
    blurb: "Someone who has worked with you and agreed to be asked.",
    fields: [
      { id: "refName", label: "Referee name", required: true },
      { id: "refEmail", label: "Referee email address", kind: "email", required: true },
    ],
  },
  {
    id: "review",
    title: "Review and submit",
    blurb: "Read it through once more, then send it.",
    fields: [{ id: "consent", label: "Halcyon Studio may keep my application for twelve months.", kind: "checkbox", required: true }],
  },
];

const START: Record<string, string> = {
  name: "Mara Jansen",
  email: "mara@kestrel.dev",
  city: "Utrecht",
  degree: "BA Interaction Design",
  school: "HKU University of the Arts",
  role: "Product designer",
};

/** What is missing in a part: its required fields with no text. */
const missingIn = (part: Part, values: Record<string, string>) => part.fields.filter((field) => field.required && !values[field.id]?.trim());

export default function Demo(): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>(START);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set(["experience"]));

  // The outline starts where a person would be halfway through: scrolled to the third section, which the outline then marks by itself.
  // On a phone the outline's bar is pinned over the top of the window, so the section stops under it.
  useEffect(() => {
    const box = scroller.current;
    const target = document.getElementById("experience");
    if (!box || !target) return;
    const bar = box.querySelector<HTMLElement>('[data-slot="form-outline"] > div')?.offsetHeight ?? 0;
    box.scrollTop = target.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 24 - bar;
  }, []);

  const sections: OutlineSection[] = PARTS.map((part) => {
    const missing = missingIn(part, values);
    if (missing.length === 0) return { id: part.id, label: part.title, status: "done" };
    return touched.has(part.id) ? { id: part.id, label: part.title, status: "attention", errorCount: missing.length } : { id: part.id, label: part.title, status: "todo" };
  });

  const touch = (id: string) => setTouched((now) => (now.has(id) ? now : new Set(now).add(id)));
  const set = (id: string, value: string) => setValues((now) => ({ ...now, [id]: value }));

  return (
    <div className="w-full overflow-hidden border-y border-border bg-background">
      <div ref={scroller} className="relative h-[40rem] overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:gap-12 lg:pt-8">
          <FormOutline sections={sections} className="max-lg:-mx-4 sm:max-lg:-mx-6" />

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              setTouched(new Set(PARTS.map((part) => part.id)));
            }}
            className="min-w-0 pt-6 lg:pt-0"
          >
            <header className="mb-8 grid gap-1 border-b border-border pb-8">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Apply to Halcyon Studio</h2>
              <p className="text-sm text-muted-foreground">Product designer, Utrecht or remote. Six short sections, and nothing is sent until the last one.</p>
            </header>

            {PARTS.map((part) => {
              const missing = missingIn(part, values);
              return (
                <section key={part.id} id={part.id} aria-labelledby={`${part.id}-title`} onBlur={() => touch(part.id)} className="border-b border-border py-8 last:border-b-0">
                  <h3 id={`${part.id}-title`} tabIndex={-1} className="text-lg font-semibold tracking-[-0.02em] outline-none">
                    {part.title}
                  </h3>
                  <p className="mt-1 mb-5 text-sm text-muted-foreground">{part.blurb}</p>
                  <div className="grid gap-5">
                    {part.fields.map((field) => {
                      const id = `field-${field.id}`;
                      const empty = Boolean(field.required) && !values[field.id]?.trim();
                      const invalid = empty && touched.has(part.id);
                      if (field.kind === "checkbox") {
                        return (
                          <div key={field.id} className="flex items-start gap-3">
                            <Checkbox id={id} checked={values[field.id] === "yes"} aria-invalid={invalid || undefined} onCheckedChange={(next) => set(field.id, next === true ? "yes" : "")} className="mt-0.5" />
                            <Label htmlFor={id} className="text-sm leading-5 font-normal">
                              {field.label}
                            </Label>
                          </div>
                        );
                      }
                      return (
                        <div key={field.id} className="grid gap-2">
                          <Label htmlFor={id}>{field.label}</Label>
                          {field.kind === "textarea" ? (
                            <Textarea id={id} rows={3} value={values[field.id] ?? ""} aria-invalid={invalid || undefined} onChange={(event) => set(field.id, event.target.value)} />
                          ) : (
                            <Input id={id} type={field.kind === "email" ? "email" : "text"} value={values[field.id] ?? ""} aria-invalid={invalid || undefined} onChange={(event) => set(field.id, event.target.value)} />
                          )}
                          {field.hint && !invalid ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
                          {invalid ? <p className="text-xs font-medium text-destructive">This one is required.</p> : null}
                        </div>
                      );
                    })}
                  </div>
                  {part.id === "review" ? (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Button type="submit">Submit application</Button>
                      <Button type="button" variant="outline">
                        Save draft
                      </Button>
                      {missing.length > 0 ? <p className="text-xs text-muted-foreground">Finish the sections marked in the outline first.</p> : null}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </form>
        </div>
      </div>
    </div>
  );
}
