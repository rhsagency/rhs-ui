import { Button } from "@rhs-ui/primitives/button";
import { VideoHero } from "@rhs-ui/marketing/video-hero";

const poster = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 640'><rect width='1200' height='640' fill='#23262b'/><path d='M0 470 L260 300 L420 400 L640 210 L860 380 L1000 290 L1200 420 V640 H0Z' fill='#3a3f46'/><path d='M0 540 L300 420 L520 500 L780 360 L1200 520 V640 H0Z' fill='#4a5058'/><circle cx='930' cy='150' r='54' fill='#c9c4b8'/></svg>",
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <VideoHero
        title="Walk the Dolomites with people who know every hut."
        description="Six-day guided hikes, small groups, luggage carried between refuges."
        poster={poster}
        alt="Mountain ridges at dusk under a low moon"
        actions={<Button size="lg">See the routes</Button>}
      />
    </div>
  );
}
