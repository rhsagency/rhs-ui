"use client";

import { AudioPlayer } from "@rhs-ui/primitives/audio-player";

const artwork = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='#2b2d31'/><circle cx='100' cy='100' r='50' fill='none' stroke='#f4f1ea' stroke-width='10'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg p-8">
      <AudioPlayer title="Why the best teams write everything down" subtitle="Slow Build, episode 42" artwork={artwork} src="" />
    </div>
  );
}
