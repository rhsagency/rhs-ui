"use client";

import { useId, useState, type ReactNode } from "react";

import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { SlugField, type SlugFieldProps } from "@rhs-ui/primitives/slug-field";

const BASE = "halcyon.example/journal";
const TAKEN = ["spring-sale", "our-story", "kettle-guide"] as const;

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Slug(props: Omit<SlugFieldProps, "id">): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Slug</Label>
      <SlugField id={id} baseUrl={BASE} taken={TAKEN} {...props} />
    </div>
  );
}

function NewPost(): React.JSX.Element {
  const id = useId();
  const [title, setTitle] = useState("Spring sale: 20% off all Kestrel kettles");
  const [report, setReport] = useState<{ slug: string; auto: boolean } | null>(null);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">New journal post</h2>
        <p className="text-xs text-muted-foreground">Change the title and the address follows. Type in the slug and it is yours.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-title`}>Title</Label>
        <Input id={`${id}-title`} value={title} onChange={(event) => setTitle(event.target.value)} autoComplete="off" />
      </div>
      <Slug name="slug" title={title} onValueChange={(slug, state) => setReport({ slug, auto: state.auto })} />
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1.5 border-t border-border pt-4 text-xs">
        <dt className="col-span-2 text-muted-foreground">Slug reported</dt>
        <dd className="col-span-2 font-mono text-[0.6875rem] break-all text-foreground">{report ? JSON.stringify(report.slug) : "nothing yet"}</dd>
        <dt className="mt-1 whitespace-nowrap text-muted-foreground">Follows the title</dt>
        <dd className="mt-1 text-right font-mono text-[0.6875rem] text-foreground">{report ? String(report.auto) : "-"}</dd>
      </dl>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: edit the title, then type in the slug to lock it. Follow title (or an emptied field) gives it back">
        <NewPost />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A slug that was typed by hand stays put when the title changes">
          <Slug title="Which pour-over kettle should you buy?" defaultValue="kettle-guide-2026" />
        </Example>
        <Example caption={<>Already used: “Our story” gives <code className="font-mono text-[0.6875rem]">our-story</code>, so it offers the next free one</>}>
          <Slug title="Our story" />
        </Example>
        <Example caption="Accents and special letters fold into plain ones: é, û, ü, ß and ø">
          <Slug title="Crème brûlée, Käse Straße & Smørrebrød" />
        </Example>
      </div>
    </div>
  );
}
