"use client";

import { useState, type ReactNode } from "react";

import { AchievementTile, type AchievementTileProps } from "@rhs-ui/application/achievement-tile";
import { IconDownload, IconFlame, IconKeyboard, IconMoon, IconTrophy, IconUsers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const TILES: readonly AchievementTileProps[] = [
  { title: "First export", description: "Export a project as a PDF or a PNG.", icon: <IconDownload />, state: "unlocked", unlockedAt: "2026-10-12" },
  { title: "Team player", description: "Invite three colleagues to a workspace.", icon: <IconUsers />, state: "progress", progress: { current: 2, goal: 3 } },
  { title: "Streak of seven", description: "Open Halcyon seven days in a row.", icon: <IconFlame />, state: "progress", progress: { current: 5, goal: 7 } },
  { title: "Night owl", description: "Finish a project between midnight and 5 AM.", icon: <IconMoon />, state: "locked" },
  { title: "Century", description: "Complete 100 tasks in a single month.", icon: <IconTrophy />, state: "unlocked", unlockedAt: "2026-09-03" },
  { title: "Tidy desk", description: "Archive 25 finished projects.", state: "locked" },
];

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [done, setDone] = useState(9);
  const earned = done >= 10;
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Case caption="Three states at one size, so they line up in a grid: unlocked is filled and dated, in progress shows its count, locked is an outline that still says how to earn it.">
        <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3">
          {TILES.map((tile) => (
            <AchievementTile key={tile.title} locale="en-GB" {...tile} />
          ))}
        </div>
      </Case>

      <Case caption="Earn it: the tenth step unlocks the tile, a short shine crosses it once and the unlock is announced. Reduced motion skips the shine.">
        {/* One tile and its two controls, as one centred stack, so the example reads as a unit and not as a tile with an empty row beside it. */}
        <div className="mx-auto grid w-full max-w-56 justify-items-center gap-4">
          <AchievementTile
            className="w-full"
            title="Keyboard hero"
            description="Finish ten tasks without touching the mouse."
            icon={<IconKeyboard />}
            state={earned ? "unlocked" : "progress"}
            progress={{ current: done, goal: 10 }}
            unlockedAt="2026-11-02"
            locale="en-GB"
          />
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" variant="outline" disabled={earned} onClick={() => setDone((count) => Math.min(10, count + 1))}>
              Finish a task
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={done === 9} onClick={() => setDone(9)}>
              Start over
            </Button>
          </div>
        </div>
      </Case>
    </div>
  );
}
