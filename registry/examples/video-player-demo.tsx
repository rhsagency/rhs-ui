"use client";

import { VideoPlayer } from "@rhs-ui/primitives/video-player";

const poster = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'><rect width='1280' height='720' fill='#2b2e33'/><circle cx='900' cy='240' r='90' fill='#c9c4b8'/><path d='M0 560 Q400 420 800 520 T1280 500 V720 H0Z' fill='#45494f'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <VideoPlayer title="Product tour, two minutes" src="" poster={poster} />
      <p className="mt-2 text-xs text-muted-foreground">Pass your own video file as src; the demo shows the poster and controls.</p>
    </div>
  );
}
