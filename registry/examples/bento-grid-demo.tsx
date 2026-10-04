import { IconLock, IconZap } from "@rhs-ui/icons";
import { BentoGrid } from "@rhs-ui/marketing/bento-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <BentoGrid
        eyebrow="Platform"
        title="One workspace, every view your team needs"
        cells={[
          {
            id: "board",
            size: "large",
            title: "Boards that plan themselves",
            description: "Drag work between stages; dates and owners follow.",
            visual: (
              <div className="grid h-full grid-cols-3 gap-3 p-5">
                {["To do", "Doing", "Done"].map((column, index) => (
                  <div key={column} className="space-y-2 rounded-xl bg-background p-3 text-xs">
                    <p className="text-muted-foreground">{column}</p>
                    {Array.from({ length: 3 - index }, (_, card) => <div key={card} className="h-10 rounded-lg border border-border" />)}
                  </div>
                ))}
              </div>
            ),
          },
          { id: "speed", title: "Under 100 ms", description: "Every action is instant, even on large teams.", visual: <div className="flex h-full items-center justify-center [&_svg]:size-10"><IconZap /></div> },
          { id: "private", title: "Private by default", description: "Encrypted, EU-hosted, never used for training.", visual: <div className="flex h-full items-center justify-center [&_svg]:size-10"><IconLock /></div> },
          {
            id: "reports",
            size: "wide",
            title: "Reports without a spreadsheet",
            description: "Cycle time, throughput and focus, per team.",
            visual: (
              <div className="flex h-full items-end gap-2 p-5">
                {[30, 55, 42, 70, 64, 88, 76, 95].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-foreground/80" style={{ height: `${height}%` }} />)}
              </div>
            ),
          },
          { id: "api", title: "API and webhooks", description: "Connect anything in an afternoon." },
        ]}
      />
    </div>
  );
}
