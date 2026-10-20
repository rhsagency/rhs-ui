"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { IconBook, IconCode, IconCube, IconHistory, IconPalette, IconRocket } from "@rhs-ui/icons";
import { LinkCard } from "@rhs-ui/primitives/link-card";

const art = (base: string, shapes: string) => ({
  src: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 240'><rect width='320' height='240' fill='${base}'/>${shapes}</svg>`),
  alt: "",
});

const COVERS = {
  tokens: art("#c9c9c9", "<circle cx='110' cy='120' r='62' fill='#7d7d7d'/><circle cx='190' cy='120' r='62' fill='#ececec' fill-opacity='.85'/>"),
  migrate: art("#bdbdbd", "<rect x='60' y='64' width='120' height='112' rx='14' fill='#efefef'/><rect x='140' y='84' width='120' height='112' rx='14' fill='#767676'/>"),
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A stand-in for a framework link (Next Link, a router link): it renders an anchor with a real href and handles the click itself. */
function RouterLink({ to, onNavigate, ...props }: ComponentProps<"a"> & { to: string; onNavigate: (to: string) => void }): React.JSX.Element {
  return (
    <a
      {...props}
      href={to}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(to);
      }}
    />
  );
}

export default function Demo(): React.JSX.Element {
  const [route, setRoute] = useState("/docs");
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Example caption="A docs home: one tab stop per card, and the ring goes around the whole card">
        <div className="grid gap-3 sm:grid-cols-2">
          <LinkCard href="#quickstart" icon={<IconRocket />} title="Quickstart" description="Install the kit, add your first component and see it in your own theme in about five minutes." />
          <LinkCard href="#components" icon={<IconCube />} title="Components" description="Every primitive, field and section, with the states you actually have to design." />
          <LinkCard href="#theming" icon={<IconPalette />} title="Theming" description="Tokens for colour, radius and type, with a dark mode that is a first-class citizen." />
          <LinkCard href="#changelog" icon={<IconHistory />} title="Changelog" description="What changed in each release, with the upgrade notes that matter." />
        </div>
      </Example>

      <Example caption="Beside a picture, for lists of resources">
        <div className="grid gap-3">
          <LinkCard href="#tokens" orientation="horizontal" image={COVERS.tokens} title="Design tokens for dark mode" description="How we derive a dark palette from one set of light tokens, and where it still needs a hand." />
          <LinkCard href="#migrate" orientation="horizontal" image={COVERS.migrate} title="Migrating from v1 to v2" description="A step-by-step guide with a codemod for the renamed props." />
        </div>
      </Example>

      <Example caption="External links add an arrow and “opens in a new tab” for screen readers; asChild keeps your router">
        <div className="grid gap-3 sm:grid-cols-2">
          <LinkCard href="https://github.com/northwind/ui" external icon={<IconCode />} title="GitHub repository" description="Read the source, file an issue or send a pull request." />
          <LinkCard asChild icon={<IconBook />} title="Forms guide" description="Fields, validation and error messages that read well aloud.">
            <RouterLink to="/docs/forms" onNavigate={setRoute} />
          </LinkCard>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Router is at <code className="rounded bg-muted px-1 py-0.5 font-mono">{route}</code>
        </p>
      </Example>
    </div>
  );
}
