"use client";

import { useState } from "react";

import { BreathingHero } from "@rhs-ui/marketing/breathing-hero";

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">The 4, 4 and 6 rhythm. The ring and the words move together; Pause stops both, and a screen reader hears each change.</p>
      <BreathingHero
        title="Three minutes to slow down."
        description="Stillwater guides your breath with a ring you can follow. No audio, no setup: press start when you are ready."
        onStart={() => setNote("Your 3-minute session is ready in the Stillwater app.")}
      />
      <p role="status" className="-mt-8 min-h-6 pb-10 text-center text-sm text-muted-foreground">
        {note}
      </p>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A longer exhale, 4, 7 and 8, starting paused. Resume continues from the first breath.</p>
      <BreathingHero
        pattern={{ in: 4, hold: 7, out: 8 }}
        defaultPaused
        title="Sleep comes easier on a long breath."
        description="The 4-7-8 pattern holds a little longer and lets go slowly. Use it in bed, with the lights off."
        cta="Start a 5-minute session"
        ctaHref="#sleep"
      />
    </div>
  );
}
