import type { ReactNode } from "react";

import { MatchTimeline, type MatchEvent } from "@rhs-ui/application/match-timeline";

/** Given out of order on purpose: the timeline sorts them by the clock. */
const FINISHED: readonly MatchEvent[] = [
  { id: "e12", minute: 12, side: "home", type: "goal", player: "Mila Kowalski", assist: "Jonas Weber", detail: "Left foot from the edge of the box" },
  { id: "e27", minute: 27, side: "away", type: "yellow-card", player: "Rafael Costa", detail: "Late challenge" },
  { id: "e34", minute: 34, side: "away", type: "goal", player: "Dario Lindqvist", assist: "Noah Fischer", detail: "Header from a corner" },
  { id: "e452", minute: 45, extraMinute: 2, side: "home", type: "penalty", player: "Mila Kowalski" },
  { id: "e53", minute: 53, side: "away", type: "substitution", player: "Ivo Marek", detail: "for Dario Lindqvist" },
  { id: "e61", minute: 61, side: "home", type: "own-goal", player: "Tariq Aziz", detail: "Deflected in off his shin" },
  { id: "e68", minute: 68, side: "home", type: "yellow-card", player: "Jonas Weber" },
  { id: "e74", minute: 74, side: "home", type: "substitution", player: "Sofia Marin", detail: "for Mila Kowalski" },
  { id: "e79", minute: 79, side: "away", type: "penalty-missed", player: "Rafael Costa", detail: "Saved by Elias Moreau" },
  { id: "e88", minute: 88, side: "home", type: "goal", player: "Sofia Marin", assist: "Jonas Weber" },
  { id: "e904", minute: 90, extraMinute: 4, side: "away", type: "red-card", player: "Ivo Marek", detail: "Second yellow card" },
];

const LIVE: readonly MatchEvent[] = [
  { id: "l9", minute: 9, side: "away", type: "goal", player: "Anouk de Vries", assist: "Lena Fischer" },
  { id: "l31", minute: 31, side: "home", type: "yellow-card", player: "Marta Silva" },
  { id: "l44", minute: 44, side: "home", type: "goal", player: "Ines Laurent", detail: "Volley at the back post" },
];

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-4 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-14">
      <Case caption="Finished: home on the left, away on the right, the running score after each goal, half time and full time as breaks. On a phone it runs in one column.">
        <MatchTimeline home="Halcyon FC" away="Kestrel United" events={FINISHED} status="finished" />
      </Case>

      <Case caption="Live: it ends with a pulsing Live that holds still under reduced motion.">
        <MatchTimeline home="Fernleaf Athletic" away="Larkspur Town" events={LIVE} status="live" />
      </Case>
    </div>
  );
}
