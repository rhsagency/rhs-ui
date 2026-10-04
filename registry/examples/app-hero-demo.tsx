import { IconStar } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { AppHero } from "@rhs-ui/marketing/app-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <AppHero
        eyebrow="For iPhone and Android"
        title="Your training plan, in your pocket."
        description="Stride builds a running plan around your week and adjusts it when life gets in the way."
        actions={
          <>
            <Button size="lg">App Store</Button>
            <Button size="lg" variant="outline">Google Play</Button>
          </>
        }
        proof={<span className="inline-flex items-center gap-1.5 [&_svg]:size-4"><IconStar /> 4.8 from 12,000 ratings</span>}
        screen={
          <div className="flex h-full flex-col gap-3 p-4 pt-10 text-xs">
            <p className="text-muted-foreground">Tuesday</p>
            <p className="text-lg font-medium leading-tight">Easy run, 6 km</p>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-muted-foreground">Pace</p>
              <p className="text-2xl font-medium tabular-nums">5:42<span className="text-xs text-muted-foreground"> /km</span></p>
            </div>
            <div className="flex h-24 items-end gap-1.5 rounded-xl bg-muted p-3">
              {[40, 65, 30, 80, 55, 90, 45].map((height, index) => (
                <span key={index} className="flex-1 rounded-sm bg-foreground" style={{ height: `${height}%` }} />
              ))}
            </div>
            <span className="mt-auto rounded-full bg-foreground py-2.5 text-center text-background">Start run</span>
          </div>
        }
      />
    </div>
  );
}
