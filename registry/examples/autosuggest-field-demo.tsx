"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { AutosuggestField, type AutosuggestFieldProps, type Suggestion } from "@rhs-ui/primitives/autosuggest-field";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";

const JOB_TITLES = [
  "Product Designer",
  "Product Manager",
  "Product Marketing Manager",
  "Senior Product Designer",
  "Growth Product Manager",
  "Brand Designer",
  "Design Engineer",
  "Engineering Manager",
  "Frontend Engineer",
  "Backend Engineer",
  "Data Analyst",
  "Data Scientist",
  "Customer Success Manager",
  "Account Executive",
  "Operations Lead",
  "Finance Controller",
  "Technical Writer",
  "Recruiter",
];

const CITIES: Suggestion[] = [
  { value: "Amsterdam", hint: "Netherlands" },
  { value: "Antwerp", hint: "Belgium" },
  { value: "Barcelona", hint: "Spain" },
  { value: "Bergen", hint: "Norway" },
  { value: "Berlin", hint: "Germany" },
  { value: "Bordeaux", hint: "France" },
  { value: "Brussels", hint: "Belgium" },
  { value: "Copenhagen", hint: "Denmark" },
  { value: "Dublin", hint: "Ireland" },
  { value: "Gothenburg", hint: "Sweden" },
  { value: "Hamburg", hint: "Germany" },
  { value: "Lisbon", hint: "Portugal" },
  { value: "Lyon", hint: "France" },
  { value: "Madrid", hint: "Spain" },
  { value: "Munich", hint: "Germany" },
  { value: "Porto", hint: "Portugal" },
  { value: "Rotterdam", hint: "Netherlands" },
  { value: "Zagreb", hint: "Croatia" },
  { value: "Zürich", hint: "Switzerland" },
];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();

/** True until the page is first used. A panel that starts open needs room under its field, so that the preview shows it whole; the first press or Tab closes it, and the room goes with it. */
function useReserved(): boolean {
  const [reserved, setReserved] = useState(true);
  useEffect(() => {
    let pressing = false;
    let timer: number | undefined;
    const release = () => setReserved(false);
    // A press that is still going on keeps the page where it is: a button that moved away under the pointer would never get its click.
    const down = () => {
      pressing = true;
    };
    const up = () => {
      pressing = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(release, 300);
    };
    // Focus that moves by itself (Tab, a screen reader) has no pointer to wait for.
    const focus = () => {
      if (!pressing) release();
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", up, true);
    document.addEventListener("focusin", focus, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", up, true);
      document.removeEventListener("focusin", focus, true);
    };
  }, []);
  return reserved;
}

/** Holds the room a panel that starts open needs, until the first press or Tab. After that the panel overlays what is below it, as it does on a real page. */
function Reserve({ className, children }: { className: string; children: ReactNode }): React.JSX.Element {
  const reserved = useReserved();
  return <div className={`transition-[min-height] duration-200 ease-out motion-reduce:transition-none ${reserved ? className : "min-h-0"}`}>{children}</div>;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Role(): React.JSX.Element {
  const id = useId();
  const [title, setTitle] = useState("prod");
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim()) setSaved(title.trim());
      }}
      className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Tell us about your role</h2>
        <p className="text-xs text-muted-foreground">Pick a suggestion, or keep exactly what you typed.</p>
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-y border-border py-3 text-xs text-muted-foreground">
        <span>{saved ? "Saved as typed" : "Value"}</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(saved ?? title)}</code>
      </p>
      <div className="grid gap-2">
        <Label htmlFor={id}>Job title</Label>
        <Reserve className="min-h-[15.5rem]">
          <AutosuggestField
            id={id}
            name="job-title"
            placeholder="Product Designer"
            options={JOB_TITLES}
            value={title}
            onValueChange={(next) => {
              setTitle(next);
              setSaved(null);
            }}
            defaultOpen
            placement="bottom"
          />
        </Reserve>
      </div>
      <Button type="submit" disabled={!title.trim()}>
        Save role
      </Button>
    </form>
  );
}

function City(): React.JSX.Element {
  const id = useId();
  // A pretend server: it answers a moment after the last keystroke, with the cities that contain what was typed.
  const [options, setOptions] = useState<Suggestion[]>(() => CITIES.filter((city) => fold(typeof city === "string" ? city : city.value).includes("ber")));
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function ask(query: string) {
    window.clearTimeout(timer.current);
    if (!query.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(() => {
      const wanted = fold(query.trim());
      setOptions(CITIES.filter((city) => fold(typeof city === "string" ? city : city.value).includes(wanted)));
      setLoading(false);
    }, 450);
  }
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>City</Label>
      <Reserve className="min-h-[8.5rem]">
        <AutosuggestField id={id} placeholder="Where do you live?" options={options} onQueryChange={ask} loading={loading} defaultValue="ber" emptyHint="No city found. We will use what you typed." defaultOpen placement="bottom" />
      </Reserve>
    </div>
  );
}

function Field({ label, options = JOB_TITLES, ...props }: { label: string } & Omit<AutosuggestFieldProps, "id" | "options"> & { options?: readonly Suggestion[] }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <AutosuggestField id={id} options={options} {...props} />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: type a title that is not in the list, and it is kept as typed">
          <Role />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="From a server: onQueryChange asks, options answers, and a spinner waits. Try zurich">
          <City />
        </Example>
        <Example caption="Nothing matches: say so, or keep the panel shut">
          <Reserve className="min-h-[7.75rem]">
            <Field label="Job title" defaultValue="Quantum chef" emptyHint="No suggestions. We will use what you typed." defaultOpen placement="bottom" />
          </Reserve>
        </Example>
        <Example caption="Waiting for the first answer">
          <Reserve className="min-h-[7.75rem]">
            <Field label="Job title" defaultValue="Dat" options={[]} loading defaultOpen placement="bottom" />
          </Reserve>
        </Example>
        <Example caption="Disabled">
          <Field label="Job title" defaultValue="Technical Writer" disabled />
        </Example>
      </div>
    </div>
  );
}
