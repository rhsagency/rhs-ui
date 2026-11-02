"use client";

import { useState, type ReactNode } from "react";

import { JoinCountCta, type JoinCountAvatar } from "@rhs-ui/marketing/join-count-cta";

/** A head and shoulders in two neutral greys, drawn as an image so the demo needs no files. */
const portrait = (background: string, figure: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='${background}'/><circle cx='32' cy='26' r='11' fill='${figure}'/><path d='M10 64c2-14 12-22 22-22s20 8 22 22z' fill='${figure}'/></svg>`,
  );

const people: JoinCountAvatar[] = [
  { name: "Maria Jansen", src: portrait("#e7e7e7", "#8c8c8c") },
  { name: "Tomas Berg", src: portrait("#cfcfcf", "#4d4d4d") },
  { name: "Aisha Rahman", src: portrait("#f1f1f1", "#a6a6a6") },
  { name: "Luca Ferri", src: portrait("#3d3d3d", "#b3b3b3") },
  { name: "Noor Haddad", src: portrait("#dcdcdc", "#6b6b6b") },
  { name: "Jonas Weber", src: portrait("#8f8f8f", "#e9e9e9") },
  { name: "Ines Costa", src: portrait("#ececec", "#7a7a7a") },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [message, setMessage] = useState("");
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <Example caption="The count is the biggest thing on the page and is dated underneath. Scrolled into view from below, it rises once; it stands still under reduced motion">
        <JoinCountCta
          count={48213}
          unit="teams"
          avatars={people}
          description="Teams that plan their week in Kestrel and have not opened a spreadsheet since."
          action={{ label: "Start free", onClick: () => setMessage("Demo only: nothing was started.") }}
          note="Free for 14 days. No card needed."
          asOf="2026-10-01"
        />
      </Example>
      <p role="status" className="min-h-6 text-center text-sm text-muted-foreground">
        {message}
      </p>
      <div className="mt-10 border-t border-border pt-10">
        <Example caption="In Dutch: the number and the date follow the locale, and labels says the fixed words in Dutch. No faces, no note">
          <JoinCountCta
            headingLevel={3}
            locale="nl-NL"
            lead="Sluit je aan bij"
            count={48213}
            unit="teams"
            description="Teams die hun week in Kestrel plannen en sindsdien geen spreadsheet meer hebben geopend."
            action={{ label: "Gratis beginnen", href: "#start" }}
            asOf="2026-10-01"
            labels={{ asOf: "per {date}" }}
          />
        </Example>
      </div>
    </div>
  );
}
