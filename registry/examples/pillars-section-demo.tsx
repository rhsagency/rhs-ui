import type { ReactNode } from "react";

import { IconBook, IconHammer, IconLeaf } from "@rhs-ui/icons";
import { PillarsSection } from "@rhs-ui/marketing/pillars-section";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Three pillars with icons, points and a link each: the headings, paragraphs, lists and links line up across the columns, whatever their length">
        <PillarsSection
          eyebrow="How we make things"
          title="Three ideas we build everything on"
          description="They are older than the company, and they decide what we make, what we leave out and what we charge."
          pillars={[
            {
              marker: <IconLeaf />,
              title: "Built to be repaired",
              description: "Every part we make can be opened, replaced and mended. Nothing is glued, welded or locked behind a serial number, so a product can outlive its first owner.",
              points: ["Spare parts for ten years", "Free repair manuals", "Standard screws and no special tools"],
              href: "#repair",
              linkLabel: "Our repair promise",
            },
            {
              marker: <IconHammer />,
              title: "Made in small runs",
              description: "We build in batches of a few hundred, so what you buy was finished by a person who can still be asked about it.",
              points: ["Batches under 300 units", "Every unit numbered", "Visit the workshop any Friday"],
              href: "#workshop",
              linkLabel: "See the workshop",
            },
            {
              marker: <IconBook />,
              title: "Explained in full",
              description: "We publish what things cost to make, what they are made of and what we earn on them, so you can decide with the facts in front of you and not the marketing.",
              points: ["A price breakdown for every product", "The materials list, with suppliers", "A yearly impact report"],
              href: "#open-books",
              linkLabel: "Read the open books",
            },
          ]}
        />
      </Example>
      <div className="mt-20 border-t border-border pt-12 sm:mt-24">
        <Example caption="Four pillars, centred, with numerals and no lists or links: a column without a list keeps its row, so nothing shifts">
          <PillarsSection
            headingLevel={3}
            align="center"
            title="How we work with clients"
            pillars={[
              { title: "Listen first", description: "The first week is questions. We write back what we heard and you correct us before anything is drawn." },
              { title: "Say no often", description: "A short list done well beats a long one done in a hurry, and we will tell you which items we would drop." },
              { title: "Ship small", description: "Something real is in front of you every two weeks, so a wrong turn costs days and never months." },
              { title: "Leave it better", description: "When we finish, your team can run it without us: documented, tested and handed over in person." },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
