"use client";

import { useState, type ReactNode } from "react";

import { StreakTracker, type StreakDay } from "@rhs-ui/application/streak-tracker";
import { addDays } from "@rhs-ui/application/streak-tracker/dates";

// A fixed "today" keeps every example the same on every load. In an app, leave `today` out and the tracker reads the browser's clock.
const TODAY = "2026-11-05";

/** `count` days in a row from `from`. */
const run = (from: string, count: number): string[] => Array.from({ length: count }, (_, index) => addDays(from, index));

const DUTCH = {
  streak: "Dag {count}",
  none: "Nog geen reeks",
  label: "Huidige reeks",
  doneToday: "Vandaag gedaan",
  keepGoing: "Doe het vandaag om door te gaan",
  start: "Rond vandaag af om te beginnen",
  week: "Deze week",
  done: "gedaan",
  missed: "gemist",
  upcoming: "komt nog",
  todayOpen: "vandaag, nog niet gedaan",
  todayDone: "vandaag, gedaan",
};

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [days, setDays] = useState<string[]>(run("2026-10-25", 11));

  function toggle(day: StreakDay) {
    setDays((current) => (day.done ? current.filter((date) => date !== day.date) : [...current, day.date]));
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-2xl gap-9">
        <Case caption="Twelve days in a row, today included. Done days are filled, today is ringed and the days to come are dashed. The week starts on Monday here because the locale is en-GB.">
          <StreakTracker days={run("2026-10-25", 12)} today={TODAY} locale="en-GB" />
        </Case>

        <Case caption="Today is still open, so the streak is alive at eleven. Press a day to change it: complete today and the count grows, undo it and it settles back. Every day is a button with a name like Thursday, today, not done yet.">
          <StreakTracker days={days} today={TODAY} locale="en-GB" onDayClick={toggle} />
        </Case>

        <Case caption="After missed days. Missed days are plain empty circles, never red, and the message only says what to do next. Weekday letters, names and all the words are in Dutch here.">
          <StreakTracker days={[...run("2026-10-20", 9), "2026-11-02"]} today={TODAY} locale="nl-NL" labels={DUTCH} />
        </Case>
      </div>
    </div>
  );
}
