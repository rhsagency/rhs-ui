"use client";

import { useState } from "react";

import { IconCheck, IconThumbsDown, IconThumbsUp } from "@rhs-ui/icons";
import { DocsPageFooter, type DocsPageFooterContributor } from "@rhs-ui/marketing/docs-page-footer";
import { Button } from "@rhs-ui/primitives/button";

/** A drawn face in two greys, so the demo needs no files. In your docs: the contributor's own picture, or nothing, and the initials are drawn. */
const portrait = (ground: string, ink: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='${ground}'/><circle cx='32' cy='26' r='11' fill='${ink}'/><path d='M10 64c2-14 12-21 22-21s20 7 22 21z' fill='${ink}'/></svg>`,
  );

const CONTRIBUTORS: readonly DocsPageFooterContributor[] = [
  { name: "Ada Okafor", image: portrait("#dcdcdc", "#6f6f6f") },
  { name: "Joris de Wit", image: portrait("#3a3a3a", "#a3a3a3") },
  { name: "Priya Nair" },
  { name: "Tomás Silva", image: portrait("#c9c9c9", "#575757") },
  { name: "Lena Fischer" },
  { name: "Ibrahim Yusuf" },
  { name: "Sanne Bakker" },
];

/**
 * The buttons stay in the page after a choice (the chosen one is pressed), so keyboard focus is never dropped, and the thank-you goes into
 * a status line that is always there, so a screen reader hears it arrive. The question is as tall as a small button, so the row stays level
 * when the line appears under it.
 */
function Feedback(): React.JSX.Element {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 rounded-2xl border border-border bg-muted/40 px-5 py-4">
      <div className="min-w-0">
        <p id="docs-feedback-question" className="text-sm leading-8 font-medium">
          Was this page helpful?
        </p>
        <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground">
          {answer ? (
            <>
              <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
              {answer === "yes" ? "Thanks. We will keep it up to date." : "Thanks. Tell us what was missing in an issue."}
            </>
          ) : null}
        </p>
      </div>
      <div role="group" aria-labelledby="docs-feedback-question" className="flex gap-2">
        <Button variant={answer === "yes" ? "default" : "outline"} size="sm" aria-pressed={answer === "yes"} onClick={() => setAnswer("yes")}>
          <IconThumbsUp />
          Yes
        </Button>
        <Button variant={answer === "no" ? "default" : "outline"} size="sm" aria-pressed={answer === "no"} onClick={() => setAnswer("no")}>
          <IconThumbsDown />
          No
        </Button>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-2xl gap-16 px-6 py-10 sm:py-14">
      <figure className="grid gap-5">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The full landing: edit link, when the page changed and who wrote it, a feedback question, and both neighbours. The direction words stay on screen, so a screen reader hears &ldquo;Next page&rdquo; with the title.
        </figcaption>
        <article>
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Retries and ordering</h2>
          <p className="mt-4 text-base leading-7 text-foreground/85">
            A failed delivery is retried eleven times over three days, with a longer wait each time. Events can arrive out of order, so compare the <code className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.875em]">created</code> timestamp
            before you overwrite anything.
          </p>
          <DocsPageFooter
            className="mt-12"
            editHref="https://example.com/kestrel/docs/edit/main/webhooks/retries.mdx"
            updated={{ label: "Last updated 12 March 2026", dateTime: "2026-03-12" }}
            contributors={CONTRIBUTORS}
            feedback={<Feedback />}
            previous={{ href: "#verify", title: "Verify the signature" }}
            next={{ href: "#testing", title: "Test webhooks on your own machine" }}
          />
        </article>
      </figure>

      <figure className="grid gap-5">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The first page of a section has no previous card, so the next one keeps to the right. With noun=&quot;guide&quot; the words read &ldquo;Next guide&rdquo;, and a single author is counted in the singular.
        </figcaption>
        <DocsPageFooter
          noun="guide"
          editHref="https://example.com/kestrel/docs/edit/main/introduction.mdx"
          updated={{ label: "Last updated 2 February 2026", dateTime: "2026-02-02" }}
          contributors={[{ name: "Ada Okafor", image: portrait("#dcdcdc", "#6f6f6f") }]}
          next={{ href: "#quickstart", title: "Quickstart: your first event in five minutes" }}
          labels={{ pager: "Guide navigation" }}
        />
      </figure>
    </div>
  );
}
