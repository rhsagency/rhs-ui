"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { IconMail, IconMailbox, IconMessage, IconPhone } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ChipSelect, type ChipOption } from "@rhs-ui/primitives/chip-select";

const TOPICS: readonly ChipOption[] = [
  { value: "product", label: "Product updates" },
  { value: "design", label: "Design systems" },
  { value: "engineering", label: "Engineering" },
  { value: "accessibility", label: "Accessibility" },
  { value: "performance", label: "Performance" },
  { value: "open-source", label: "Open source" },
  { value: "security", label: "Security" },
  { value: "research", label: "Research" },
  { value: "case-studies", label: "Case studies" },
  { value: "events", label: "Events" },
  { value: "careers", label: "Careers" },
  { value: "pricing", label: "Pricing changes" },
  { value: "podcast", label: "Podcast" },
  { value: "community", label: "Community" },
];

const ALLERGENS: readonly ChipOption[] = ["Gluten", "Dairy", "Eggs", "Peanuts", "Tree nuts", "Soy", "Fish", "Shellfish", "Sesame", "Mustard"].map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }));

const SKILLS: readonly ChipOption[] = ["Figma", "TypeScript", "Accessibility", "Motion", "Research", "Copywriting", "Illustration", "Prototyping", "Data viz", "Brand"].map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }));

const CONTACT: readonly ChipOption[] = [
  { value: "email", label: "Email", icon: <IconMail /> },
  { value: "phone", label: "Phone", icon: <IconPhone /> },
  { value: "sms", label: "Text message", icon: <IconMessage /> },
  { value: "post", label: "Post", icon: <IconMailbox />, disabled: true },
];

const LANGUAGES: readonly ChipOption[] = ["English", "Dutch", "German", "French", "Spanish", "Portuguese"].map((label) => ({ value: label.toLowerCase(), label }));

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs";

function Reported({ value }: { value: unknown }): React.JSX.Element {
  return (
    <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
      <span>Reported</span>
      <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(value).replace(/,/g, ", ")}</code>
    </p>
  );
}

function Newsletter(): React.JSX.Element {
  const [topics, setTopics] = useState<string[]>(["design", "accessibility", "engineering"]);
  return (
    <div className={card}>
      <ChipSelect
        mode="multiple"
        legend="What do you want to hear about?"
        description="The Halcyon letter goes out once a month and only covers what you choose."
        options={TOPICS}
        max={5}
        value={topics}
        onValueChange={setTopics}
      />
      <Reported value={topics} />
    </div>
  );
}

function Profile(): React.JSX.Element {
  const [result, setResult] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(new FormData(event.currentTarget).getAll("skills").join(", "));
  }
  return (
    <form onSubmit={submit} className={card}>
      <ChipSelect
        mode="multiple"
        name="skills"
        legend="Your strongest skills"
        description="Kestrel matches you with projects that need at least three of them."
        options={SKILLS}
        min={3}
        defaultValue={["figma", "research"]}
      />
      <Button type="submit">Continue</Button>
      <p role="status" className="min-h-4 border-t border-border pt-4 text-xs text-muted-foreground">
        {result === null ? "Leave the chips with fewer than three chosen, or press Continue: the line turns into an error." : `Submitted: ${result}`}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  const [diet, setDiet] = useState<string[]>(["gluten", "peanuts", "sesame"]);
  const [contact, setContact] = useState("email");
  const [spoken, setSpoken] = useState<string[]>([]);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: up to five, and the chips that are left turn off at the limit">
          <Newsletter />
        </Example>
        <Example caption="A minimum is checked when you leave the group or submit the form">
          <Profile />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="At the limit: three chosen, so the others are off and the line says why">
          <ChipSelect mode="multiple" legend="Allergens to avoid" options={ALLERGENS} max={3} value={diet} onValueChange={setDiet} />
        </Example>
        <Example caption="One choice with icons: a radio group, so the arrow keys move and choose. Post is off.">
          <ChipSelect legend="How should we reach you?" options={CONTACT} value={contact} onValueChange={setContact} />
        </Example>
        <Example caption="An error from your form library, passed as error">
          <ChipSelect mode="multiple" legend="Languages you speak" options={LANGUAGES} value={spoken} onValueChange={setSpoken} error="Choose at least one language" />
        </Example>
      </div>
    </div>
  );
}
