import { ReleaseHero } from "@rhs-ui/marketing/release-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">New release, with breaking changes</p>
      <ReleaseHero
        className="pt-8 sm:pt-8"
        product="Kestrel"
        version="v4.2"
        releasedAt="2026-10-20"
        channel="new"
        highlights={[
          { title: "Streaming by default", description: "Pages start rendering after the first byte, with no config change." },
          { title: "Typed routes", description: "Links and params are checked against your file tree at build time." },
          { title: "Builds 40% faster", description: "An incremental cache keeps unchanged routes out of the pipeline." },
        ]}
        notesHref="#notes"
        upgradeHref="#upgrade"
        breaking={{ summary: "Node 18 is no longer supported.", href: "#migrate", linkLabel: "Migration guide" }}
      />
      <p className="border-t border-border pt-6 text-xs text-muted-foreground">Long-term support, a longer version</p>
      <ReleaseHero
        className="pt-8 sm:pt-8"
        product="Kestrel"
        version="v3.9.14"
        releasedAt="2026-09-08"
        channel="lts"
        highlights={[
          { title: "Security fixes only", description: "Patches for 18 months, with no new features to review." },
          { title: "Node 18 and 20", description: "The last line that still runs on Node 18." },
          { title: "Drop-in upgrade", description: "Every 3.x project updates without touching its code." },
        ]}
        notesHref="#notes"
        upgradeHref="#upgrade"
        upgradeLabel="Stay on LTS"
      />
    </div>
  );
}
