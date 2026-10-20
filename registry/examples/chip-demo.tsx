"use client";

import { useId, useState, type ReactNode } from "react";

import { IconBook, IconCode, IconMegaphone, IconPalette, IconStar } from "@rhs-ui/icons";
import { Chip } from "@rhs-ui/primitives/chip";

const AREAS = [
  { id: "design", label: "Design", icon: <IconPalette /> },
  { id: "research", label: "Research", icon: <IconBook /> },
  { id: "engineering", label: "Engineering", icon: <IconCode /> },
  { id: "marketing", label: "Marketing", icon: <IconMegaphone /> },
] as const;

const PROJECTS = [
  { name: "Kestrel onboarding", area: "design" },
  { name: "Halcyon pricing page", area: "design" },
  { name: "Northwind API v2", area: "engineering" },
  { name: "Polder checkout", area: "engineering" },
  { name: "Lumen user interviews", area: "research" },
  { name: "Autumn launch campaign", area: "marketing" },
  { name: "Brand guidelines v3", area: "design" },
  { name: "Churn analysis", area: "research" },
] as const;

const PEOPLE = [
  { name: "Ines Kowalski" },
  { name: "Tomas Brandt" },
  { name: "Mara Okafor" },
] as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [areas, setAreas] = useState<readonly string[]>(["design", "engineering"]);
  const [tags, setTags] = useState<readonly string[]>(["Onboarding", "Pricing", "Q4 launch"]);
  const [draft, setDraft] = useState("");
  const [invited, setInvited] = useState<readonly string[]>(PEOPLE.map((person) => person.name));
  const [assignee, setAssignee] = useState<readonly string[]>(["Tomas Brandt"]);
  const invitedLabel = useId();
  const assigneeLabel = useId();

  const shown = PROJECTS.filter((project) => areas.length === 0 || areas.includes(project.area)).length;
  const toggle = (list: readonly string[], value: string) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="Filter chips are toggle buttons: a check says selected, so it never rests on the fill alone">
        <div role="group" aria-label="Filter by area" className="flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <Chip key={area.id} variant="toggle" icon={area.icon} selected={areas.includes(area.id)} onSelectedChange={() => setAreas((list) => toggle(list, area.id))}>
              {area.label}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {shown} of {PROJECTS.length} projects
        </p>
      </Example>

      <Example caption="Input chips: remove with the button, or Tab to a chip and press Backspace or Delete. Focus moves to the next one.">
        <div className="flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-xl border border-input bg-background p-2 shadow-xs transition-[border-color,box-shadow] duration-150 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40">
          {tags.map((tag) => (
            <Chip key={tag} variant="input" onRemove={() => setTags((list) => list.filter((item) => item !== tag))}>
              {tag}
            </Chip>
          ))}
          <input
            aria-label="Add a tag"
            value={draft}
            placeholder={tags.length ? "Add a tag" : "Type a tag and press Enter"}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const next = draft.trim();
              if (next && !tags.includes(next)) setTags((list) => [...list, next]);
              setDraft("");
            }}
            className="h-8 min-w-28 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </Example>

      <Example caption="With a person: an avatar leads the label, and the label names them">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <p id={invitedLabel} className="text-xs text-muted-foreground">
              Invited
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby={invitedLabel}>
              {PEOPLE.filter((person) => invited.includes(person.name)).map((person) => (
                <Chip key={person.name} variant="input" avatar={{ name: person.name }} onRemove={() => setInvited((list) => list.filter((name) => name !== person.name))}>
                  {person.name}
                </Chip>
              ))}
              {invited.length === 0 ? <p className="text-sm text-muted-foreground">Nobody is invited.</p> : null}
            </div>
          </div>
          <div className="grid gap-2">
            <p id={assigneeLabel} className="text-xs text-muted-foreground">
              Assigned to
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby={assigneeLabel}>
              {PEOPLE.map((person) => (
                <Chip key={person.name} variant="toggle" avatar={{ name: person.name }} selected={assignee.includes(person.name)} onSelectedChange={() => setAssignee((list) => toggle(list, person.name))}>
                  {person.name}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Example>

      <Example caption="Static chips show an attribute. Sizes are 24, 32 and 40px; disabled is dimmed.">
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" icon={<IconStar />}>
            Beta
          </Chip>
          <Chip size="md">v2.4.0</Chip>
          <Chip size="lg" icon={<IconCode />}>
            Frontend
          </Chip>
          <Chip variant="toggle" disabled>
            Archived
          </Chip>
          <Chip variant="input" disabled>
            Locked tag
          </Chip>
        </div>
      </Example>
    </div>
  );
}
