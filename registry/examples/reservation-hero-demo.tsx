"use client";

import { useState } from "react";

import { ReservationHero, type ReservationChoice, type ReservationSlot } from "@rhs-ui/marketing/reservation-hero";

interface Mood {
  glow: string;
  edge: string;
  light: string;
  cloth: string;
  shade: string;
  wine: string;
  candle: boolean;
}

/* The pictures are drawn for the demo, so they need no files. In your site: a photograph of the room or the table. */
function tableSetting(mood: Mood): string {
  const bokeh = [
    [120, 150, 74, 0.2],
    [270, 84, 40, 0.28],
    [650, 130, 92, 0.18],
    [736, 318, 52, 0.26],
    [86, 372, 58, 0.2],
    [548, 236, 34, 0.3],
    [340, 214, 26, 0.26],
    [470, 90, 30, 0.22],
  ]
    .map(([x, y, r, o]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${mood.light}' opacity='${o}'/>`)
    .join("");
  const glass = (x: number) =>
    `<path d='M${x - 34} 520h68c0 54-15 90-34 96-19-6-34-42-34-96z' fill='#e6eef0' opacity='.38' stroke='#fff' stroke-opacity='.55' stroke-width='2'/>` +
    `<path d='M${x - 31} 560h62c-1 38-13 56-31 62-18-6-30-24-31-62z' fill='${mood.wine}' opacity='.92'/>` +
    `<path d='M${x} 616V696' stroke='#e6eef0' stroke-opacity='.7' stroke-width='5'/>` +
    `<ellipse cx='${x}' cy='700' rx='38' ry='9' fill='#e6eef0' opacity='.6'/>`;
  const plate = (x: number) =>
    `<ellipse cx='${x}' cy='828' rx='156' ry='44' fill='#e2d9c6'/><ellipse cx='${x}' cy='822' rx='138' ry='36' fill='#f7f2e8'/><ellipse cx='${x}' cy='822' rx='88' ry='21' fill='#eee6d6'/>`;
  const centre = mood.candle
    ? `<circle cx='400' cy='516' r='200' fill='url(#glow)'/>` +
      `<ellipse cx='400' cy='716' rx='66' ry='15' fill='#b88a4e'/><rect x='378' y='568' width='44' height='150' rx='6' fill='#f3e9d1'/>` +
      `<rect x='398' y='546' width='4' height='24' rx='2' fill='#3a2c24'/>` +
      `<path d='M400 470c17 28 21 52 0 76-21-24-17-48 0-76z' fill='#f6c457'/><path d='M400 502c8 14 9 26 0 36-9-10-8-22 0-36z' fill='#fff3c7'/>`
    : `<path d='M372 596h56l-6 118h-44z' fill='#d3e3df' opacity='.85'/>` +
      `<path d='M400 596C388 540 372 510 352 486M400 596C404 530 418 498 440 470M400 596C398 548 392 512 396 470' stroke='#6f8a5a' stroke-width='5' stroke-linecap='round' fill='none'/>` +
      `<circle cx='352' cy='484' r='22' fill='#eab4a2'/><circle cx='440' cy='468' r='26' fill='#f5e3a6'/><circle cx='396' cy='466' r='20' fill='#e7a28e'/>`;
  const art = [
    `<defs><radialGradient id='room' cx='50%' cy='44%' r='62%'><stop offset='0' stop-color='${mood.glow}'/><stop offset='1' stop-color='${mood.edge}'/></radialGradient><radialGradient id='glow'><stop offset='0' stop-color='#f6c457' stop-opacity='.55'/><stop offset='1' stop-color='#f6c457' stop-opacity='0'/></radialGradient></defs>`,
    `<rect width='800' height='1000' fill='url(#room)'/>`,
    bokeh,
    `<path d='M0 640H800V1000H0Z' fill='${mood.cloth}'/><path d='M0 640H800V668H0Z' fill='${mood.shade}' opacity='.55'/>`,
    `<path d='M190 668V1000M610 668V1000' stroke='${mood.shade}' stroke-width='4' opacity='.55'/>`,
    plate(200),
    plate(600),
    `<rect x='684' y='470' width='32' height='100' rx='10' fill='#1d3527'/><rect x='660' y='556' width='80' height='152' rx='16' fill='#1d3527'/><rect x='666' y='614' width='68' height='64' rx='4' fill='#e8dfc9'/><rect x='684' y='460' width='32' height='14' rx='5' fill='#b88a4e'/>`,
    glass(290),
    glass(510),
    centre,
  ].join("");
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>${art}</svg>`);
}

const evening = tableSetting({ glow: "#5e4231", edge: "#211915", light: "#f2b04a", cloth: "#ece5d6", shade: "#d3c9b4", wine: "#6c1c29", candle: true });
const lunch = tableSetting({ glow: "#eef1e6", edge: "#c3cdbb", light: "#ffffff", cloth: "#f5f0e5", shade: "#ddd5c3", wine: "#e4cd7a", candle: false });

const TIMES = ["17:30", "18:15", "19:00", "19:45", "20:30", "21:15"];

/* A booking system's answer, simulated: a short wait, then the times. Which ones are taken depends on the day and the party, by a fixed rule, so the demo reads the same on every visit. */
function slotsFor(date: string, party: number): Promise<ReservationSlot[]> {
  const day = Number(date.slice(8));
  const times = TIMES.map((time, index) => ({ time, full: (day * 2 + party + index * 5) % 6 < (party > 6 ? 4 : 2) }));
  return new Promise((resolve) => window.setTimeout(() => resolve(times), 180));
}

const lunchTimes: ReservationSlot[] = [{ time: "12:00" }, { time: "12:30" }, { time: "13:00", full: true }, { time: "13:30" }, { time: "14:00" }, { time: "14:30", full: true }];

export default function Demo(): React.JSX.Element {
  const [first, setFirst] = useState<ReservationChoice | null>(null);
  const [second, setSecond] = useState<ReservationChoice | null>(null);
  // onReserve hands the choice to your app. Here it only says what it received, so the press can be seen.
  const said = (choice: ReservationChoice | null) =>
    choice ? `Handed to your app: a table for ${choice.party} on ${choice.date} at ${choice.time}. This is where your booking starts.` : "";

  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">On a Friday, with times that load for the party and the day. Monday is closed, so it cannot be picked.</p>
      <ReservationHero
        className="py-8 sm:py-10"
        name="Osteria Halcyon"
        description="Wood-fired pasta and a short Italian wine list by the canal, open every night but Monday."
        image={{ src: evening, alt: "A candlelit table set for two, with two glasses of red wine and a bottle", width: 800, height: 1000 }}
        slotsFor={slotsFor}
        closedDays={[1]}
        timeZone="Europe/Amsterdam"
        today="2026-11-06"
        onReserve={setFirst}
      />
      <p role="status" className="min-h-4 text-xs text-foreground">
        {said(first)}
      </p>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A fixed list of times for every open day, in 12-hour times. Today is a Monday, so the date starts on Tuesday.</p>
      <ReservationHero
        className="py-8 sm:py-10"
        name="Kestrel Bistro"
        description="A light lunch of salads, soups and warm bread, in the courtyard when it is dry."
        image={{ src: lunch, alt: "A lunch table with a small vase of flowers and two glasses of white wine", width: 800, height: 1000 }}
        slots={lunchTimes}
        closedDays={[0, 1]}
        defaultParty={4}
        hourCycle="h12"
        timeZone="Europe/Amsterdam"
        today="2026-11-09"
        onReserve={setSecond}
      />
      <p role="status" className="min-h-4 text-xs text-foreground">
        {said(second)}
      </p>
    </div>
  );
}
