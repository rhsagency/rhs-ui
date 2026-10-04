import { IconStar } from "@rhs-ui/icons";
import { AppDownloadHero } from "@rhs-ui/marketing/app-download-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <AppDownloadHero
        title="Your training plan, in your pocket."
        description="Workouts that adapt to how you slept, what you lifted last week and the time you have today."
        stores={[{ store: "app-store", href: "#app-store" }, { store: "google-play", href: "#google-play" }]}
        rating={<span className="inline-flex items-center gap-1.5"><IconStar className="size-4" /> 4.9 average from 12,400 ratings</span>}
        screen={
          <div className="flex h-full flex-col gap-3 p-4 text-xs">
            <p className="pt-6 text-[10px] text-muted-foreground">Thursday</p>
            <p className="text-lg font-medium tracking-[-.03em]">Upper body, 42 min</p>
            {["Bench press, 4 × 6", "Pull-ups, 4 × 8", "Overhead press, 3 × 8", "Rows, 3 × 10"].map((set, index) => (
              <p key={set} className="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5">
                <span className={index === 0 ? "size-3 rounded-full bg-foreground" : "size-3 rounded-full border border-border"} />
                {set}
              </p>
            ))}
            <p className="mt-auto rounded-full bg-foreground py-2.5 text-center font-medium text-background">Start workout</p>
          </div>
        }
      />
    </div>
  );
}
