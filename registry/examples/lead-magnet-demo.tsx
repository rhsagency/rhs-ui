"use client";

import { LeadMagnet } from "@rhs-ui/marketing/lead-magnet";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <LeadMagnet
        kind="Free guide"
        title="The calm roadmap: a 24-page playbook."
        description="How eight product teams plan a quarter without a single all-day workshop."
        contents={["The one-page roadmap template", "A decision log you will keep using", "How to say no to a feature", "Three real roadmaps, annotated"]}
        cover={
          <div className="flex size-full flex-col justify-between bg-foreground p-5 text-background">
            <span className="text-[10px] tracking-[.2em] uppercase opacity-70">Playbook</span>
            <span className="text-2xl leading-tight font-medium tracking-[-.04em]">The calm roadmap</span>
          </div>
        }
        downloadHref="#guide.pdf"
        onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
      />
    </div>
  );
}
