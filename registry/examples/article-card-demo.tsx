import type { ReactNode } from "react";

import { ArticleCard, type ArticleCardImage } from "@rhs-ui/application/article-card";

// Drawn covers as data URIs, so the preview needs no image host. Each has a tiny placeholder of its own, the way a framework hands one over.
const svg = (body: string, width = 800, height = 500) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>`);

const cover = (body: string, tint: string): ArticleCardImage => ({
  src: svg(body),
  placeholder: svg(`<rect width="8" height="5" fill="${tint}"/><rect x="3" y="1" width="3" height="3" fill="#00000022"/>`, 8, 5),
});

const COVERS = {
  estimating: cover(
    `<rect width="800" height="500" fill="#d9d6cf"/><circle cx="540" cy="250" r="176" fill="#c9c4b9"/><circle cx="540" cy="250" r="116" fill="#b0aa9d"/><circle cx="540" cy="250" r="56" fill="#8d877c"/><rect x="88" y="96" width="170" height="12" rx="6" fill="#b0aa9d"/><rect x="88" y="126" width="112" height="12" rx="6" fill="#c9c4b9"/>`,
    "#cfcabf",
  ),
  typeScale: cover(
    `<rect width="800" height="500" fill="#26282b"/><rect x="112" y="104" width="430" height="48" rx="8" fill="#9096a0"/><rect x="112" y="178" width="350" height="36" rx="8" fill="#6f747c"/><rect x="112" y="240" width="270" height="26" rx="8" fill="#575b62"/><rect x="112" y="292" width="196" height="18" rx="8" fill="#45484e"/><rect x="112" y="334" width="136" height="10" rx="5" fill="#3a3d42"/>`,
    "#33363a",
  ),
  fridays: cover(
    `<rect width="800" height="500" fill="#e9e7e2"/><circle cx="636" cy="124" r="48" fill="#d7d2c7"/><path d="M0 500 220 224 392 404 540 176 800 500Z" fill="#cfcabf"/><path d="M0 500 300 316 484 452 648 296 800 500Z" fill="#a39d91"/>`,
    "#d9d5cb",
  ),
  october: cover(
    `<rect width="800" height="500" fill="#b9bdc1"/><rect x="150" y="84" width="500" height="334" rx="22" fill="#e6e8ea"/><path d="M172 84h456a22 22 0 0 1 22 22v34H150v-34a22 22 0 0 1 22-22Z" fill="#d2d5d8"/><circle cx="190" cy="112" r="8" fill="#b4b8bc"/><circle cx="216" cy="112" r="8" fill="#b4b8bc"/><circle cx="242" cy="112" r="8" fill="#b4b8bc"/><rect x="190" y="180" width="210" height="16" rx="8" fill="#a0a5aa"/><rect x="190" y="214" width="320" height="12" rx="6" fill="#c3c7cb"/><rect x="190" y="240" width="290" height="12" rx="6" fill="#c3c7cb"/><rect x="190" y="266" width="250" height="12" rx="6" fill="#c3c7cb"/><rect x="190" y="320" width="96" height="34" rx="17" fill="#8e949a"/>`,
    "#c9ccd0",
  ),
  migration: cover(
    `<rect width="800" height="500" fill="#dcdad4"/><rect x="120" y="120" width="200" height="260" rx="18" fill="#c3bfb6"/><rect x="360" y="120" width="320" height="120" rx="18" fill="#b2ada3"/><rect x="360" y="270" width="320" height="110" rx="18" fill="#c9c5bc"/><path d="M326 250h28M344 238l12 12-12 12" fill="none" stroke="#8d877c" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
    "#cdc9c0",
  ),
};

function Section({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid gap-4">
      <h2 className="text-center text-xs font-normal text-muted-foreground">{caption}</h2>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl gap-10">
      <Section caption="Vertical, in a grid: headlines and summaries are cut, and the author sits at the bottom of every card">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard
            href="#estimating"
            image={COVERS.estimating}
            category="Process"
            date="2026-10-14"
            locale="en-GB"
            title="Why we stopped estimating in hours"
            excerpt="Six months of shipping in appetites instead of estimates, and what it did to our weeks, our roadmap and the way we talk to clients."
            author={{ name: "Mara Okafor" }}
            readingTime="6 min read"
          />
          <ArticleCard
            href="#type-scale"
            image={COVERS.typeScale}
            category="Design"
            date="2026-10-02"
            locale="en-GB"
            title="A type scale that survives a redesign, and the three rules we broke on the way there"
            excerpt="Five sizes, one ratio, and the rule that kept our marketing site and our app in step through two rebrands and a dark mode."
            author={{ name: "Leo Martins" }}
            readingTime="4 min read"
          />
          <ArticleCard
            href="#fridays"
            image={COVERS.fridays}
            category="Engineering"
            date="2026-09-18"
            locale="en-GB"
            title="Shipping on Fridays, safely"
            excerpt="Feature flags, a five minute rollback and the checklist we run before every release."
            author={{ name: "Priya Nair" }}
            readingTime="8 min read"
          />
        </div>
      </Section>

      <Section caption="Horizontal, in a wide column: the picture moves beside the text once the card itself is 40rem wide">
        <ArticleCard
          orientation="horizontal"
          href="#october"
          image={COVERS.october}
          category="Release notes"
          date="2026-10-27"
          locale="en-GB"
          title="What is new in October: faster exports, a calmer inbox and a long overdue dark mode"
          excerpt="Exports now run in the background and land in your inbox when they are ready. Notifications are grouped by project, so a busy afternoon is one line instead of forty. And yes, the dark theme is finally here, with every chart and table checked in it."
          author={{ name: "Tomas Brandt" }}
          readingTime="3 min read"
        />
      </Section>

      <Section caption="The same horizontal card in narrow columns stacks, and a card without a picture is just the text">
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <ArticleCard
            className="h-auto"
            orientation="horizontal"
            href="#migration"
            image={COVERS.migration}
            category="Docs"
            date="2026-10-21"
            locale="en-GB"
            timeZone="America/Los_Angeles"
            title="Migrating from v2 to v3, step by step"
            excerpt="Which breaking changes matter, which codemods to run, and how to roll out in two pull requests."
            author={{ name: "Ines Kowalski" }}
            readingTime="12 min read"
          />
          <ArticleCard
            className="h-auto"
            orientation="horizontal"
            href="#notice"
            category="Notice"
            date="2026-10-09"
            locale="en-GB"
            title="Scheduled maintenance on Saturday 14 November, 02:00 to 03:30 UTC"
            excerpt="Reads keep working throughout. Writes queue for up to ten minutes while we move the primary to the new region, then catch up on their own."
            readingTime="1 min read"
          />
        </div>
      </Section>

      <p className="text-center text-xs text-balance text-muted-foreground">Every date here is a date-only string such as 2026-10-21, so it is the day it says in any time zone. The migration card is written for America/Los_Angeles and still reads 21 Oct 2026.</p>
    </div>
  );
}
