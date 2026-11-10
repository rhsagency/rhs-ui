"use client";

import { useState } from "react";

import { TestimonialsByRole, type RoleTestimonial } from "@rhs-ui/marketing/testimonials-by-role";

type Hair = "none" | "bun" | "long" | "short";

/** A portrait drawn for the demo: a head and shoulders on a pale ground. In your page: a photograph of the person. */
function portrait(ground: string, hair: Hair): string {
  const behind = hair === "long" ? "<path d='M29 42c0-15 8-26 19-26s19 11 19 26v16H29z' fill='#3c3c3c'/>" : "";
  const above =
    hair === "bun"
      ? "<circle cx='48' cy='17' r='7' fill='#3c3c3c'/><path d='M31 36c0-11 7-17 17-17s17 6 17 17c-5-6-10-8-17-8s-12 2-17 8z' fill='#3c3c3c'/>"
      : hair === "short"
        ? "<path d='M31 37c0-12 7-19 17-19s17 7 17 19c-5-6-10-8-17-8s-12 2-17 8z' fill='#3c3c3c'/>"
        : "";
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='${ground}'/>${behind}<circle cx='48' cy='38' r='17' fill='#a0a0a0'/>${above}<path d='M14 96c2-20 17-30 34-30s32 10 34 30z' fill='#626262'/></svg>`,
    )
  );
}

const GROUPS = ["Founders", "Designers", "Engineers", "Marketers"] as const;

const QUOTES: readonly RoleTestimonial[] = [
  { id: "f1", group: "Founders", name: "Ines Moreau", role: "Founder, Atelier Moreau", avatar: portrait("#e2e2e2", "long"), quote: "I stopped being the person who knows where everything stands. The studio can see it, so Monday meetings take ten minutes." },
  { id: "d1", group: "Designers", name: "Sam Okafor", role: "Design lead, Harbour & Co", avatar: portrait("#d6d6d6", "short"), quote: "The first planning tool our designers open without being asked. Reviews finally sit next to the work." },
  { id: "e1", group: "Engineers", name: "Elif Aksoy", role: "Engineering manager, Atlas Rail", quote: "I was the sceptic in the room. Then I read the API, and six weeks later I am the one asking for webhooks." },
  { id: "m1", group: "Marketers", name: "Lotte de Vries", role: "Head of marketing, Fieldwork", avatar: portrait("#e8e8e8", "bun"), quote: "Campaign launches used to depend on three people being free on the same day. Now the calendar says who is." },
  { id: "f2", group: "Founders", name: "Arjun Mehta", role: "Partner, Mirror Labs", quote: "It feels like it was made by people who run a studio. Setup took an afternoon, and nobody asked for training." },
  { id: "e2", group: "Engineers", name: "Daniel Okafor", role: "CTO, Lumen Energy", avatar: portrait("#d9d9d9", "none"), quote: "Audit logs, SSO and an export that works. The boring parts are solid, which is the only reason we looked at the clever parts." },
  { id: "d2", group: "Designers", name: "Maya Lindqvist", role: "Art director, Oak Lane", quote: "Handoff stopped being a meeting. The brief, the files and the feedback live in one place, in order." },
  { id: "f3", group: "Founders", name: "Priya Raman", role: "Co-founder, Fjord Freight", avatar: portrait("#e4e4e4", "long"), quote: "We cancelled three tools in the first month. The invoice in month twelve matched month one." },
  { id: "e3", group: "Engineers", name: "Jonas Keller", role: "Staff engineer, Kestrel Studio", quote: "Rate limits are documented, errors are readable, and the changelog tells you what broke before it does." },
  { id: "m2", group: "Marketers", name: "Tomás Herrera", role: "Growth lead, Polder Health", avatar: portrait("#dcdcdc", "short"), quote: "Reporting that finance and marketing both accept. That alone was worth the switch." },
  { id: "d3", group: "Designers", name: "Noor Haddad", role: "Product designer, Northwind", avatar: portrait("#e6e6e6", "bun"), quote: "Comments land on the exact frame, and the status updates itself when the developer ships it." },
  { id: "f4", group: "Founders", name: "Marit de Vries", role: "Founder, Studio Marit", quote: "Clients see progress without a single status email from us. I got my Fridays back." },
];

export default function Demo(): React.JSX.Element {
  const [group, setGroup] = useState<string | null>("Marketers");

  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Twelve quotes, five chips. Choose a group and the grid narrows in place: the quotes crossfade and the section glides to its new height, so nothing jumps. The count under the chips is a polite live region ("4 of 12 quotes"), and the chips are one toggle group, so the arrow keys move between them.
        </figcaption>
        <TestimonialsByRole
          title="Hear from people who do your job"
          description="Pick your role and read what it was like for them."
          groups={GROUPS}
          testimonials={QUOTES}
          className="py-2 sm:py-4"
        />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The columns follow the count, so a short result is never left hugging one side: two quotes fill two columns here (Marketers is selected), one sits in the middle at a readable width, four make two by two, and three or more fill three from 1024px.
        </figcaption>
        <TestimonialsByRole
          title="Marketing teams, in their own words"
          groups={GROUPS}
          defaultGroup="Marketers"
          testimonials={QUOTES}
          className="py-2 sm:py-4"
        />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          A group without quotes says so in one line and offers the way back; the page controls the chips here ({group ?? "All"} is selected), so the same filter can be set from outside.
        </figcaption>
        <TestimonialsByRole
          title="What our newest customers say"
          groups={GROUPS}
          group={group}
          onGroupChange={setGroup}
          testimonials={QUOTES.filter((item) => item.group !== "Marketers").slice(0, 5)}
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}
