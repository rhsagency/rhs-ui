"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconPlay } from "@rhs-ui/icons";
import { DurationText, type DurationFormat } from "@rhs-ui/primitives/duration-text";
import { Slider } from "@rhs-ui/primitives/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const FORMATS = [
  { value: "narrow", label: "Narrow" },
  { value: "short", label: "Short" },
  { value: "long", label: "Long" },
  { value: "clock", label: "Clock" },
] as const;

const UNITS = [
  { value: "1", label: "1 unit" },
  { value: "2", label: "2 units" },
  { value: "3", label: "3 units" },
] as const;

/** Each preset is exactly what its label says, so the readout never disagrees with the button that was pressed. */
const PRESETS = [
  { value: "0", label: "0" },
  { value: "45", label: "45s" },
  { value: "240", label: "4m" },
  { value: "5400", label: "1.5h" },
  { value: "100800", label: "28h" },
] as const;

/** Thirty hours, so the slider reaches the longest preset (28h) and its thumb always sits where the readout says. */
const SLIDER_MAX = 108_000;

/** A flat drawing for a thumbnail, so the demo needs no image file. */
const art = (shapes: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'>${shapes}</svg>`);

const VIDEOS = [
  {
    title: "Getting started with Halcyon",
    length: 245,
    image: art("<rect width='320' height='180' fill='#dcdad4'/><rect x='70' y='34' width='180' height='104' rx='10' fill='#fafafa' stroke='#bdb8ad' stroke-width='3'/><rect x='88' y='54' width='60' height='10' rx='5' fill='#8d877c'/><rect x='88' y='76' width='144' height='8' rx='4' fill='#c9c3b6'/><rect x='88' y='94' width='110' height='8' rx='4' fill='#c9c3b6'/><rect x='40' y='148' width='240' height='10' rx='5' fill='#bdb8ad'/>"),
  },
  {
    title: "Inside the Kestrel rollout",
    length: 1830,
    image: art("<rect width='320' height='180' fill='#2f3236'/><circle cx='236' cy='58' r='24' fill='#6b7078'/><path d='M30 142 L92 100 L144 122 L204 82 L292 112' fill='none' stroke='#9aa0a8' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>"),
  },
  {
    title: "Office hours, September recording",
    length: 5445,
    image: art("<rect width='320' height='180' fill='#c9ccd1'/><circle cx='160' cy='72' r='26' fill='#6b7078'/><rect x='112' y='108' width='96' height='90' rx='44' fill='#6b7078'/><rect x='24' y='26' width='64' height='40' rx='6' fill='#e9e7e2'/><rect x='236' y='26' width='60' height='40' rx='6' fill='#e9e7e2'/>"),
  },
] as const;

const CALLS = [
  { who: "Marit de Vries", when: "Today, 09:14", length: 372 },
  { who: "Northwind support", when: "Today, 08:02", length: 2710 },
  { who: "Joris Bakker", when: "Yesterday", length: 48 },
  { who: "Kestrel Analytics", when: "Mon 19 Oct", length: 0 },
] as const;

export default function Demo(): React.JSX.Element {
  const [seconds, setSeconds] = useState(5400);
  const [format, setFormat] = useState<DurationFormat>("narrow");
  const [units, setUnits] = useState("2");
  const maxUnits = Number(units);

  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Try it: the eye reads the short form, a screen reader hears the long one">
        {/* One column that may shrink: with an automatic column the presets set its minimum and a phone scrolls sideways. */}
        <div className="grid max-w-xl grid-cols-[minmax(0,1fr)] gap-6 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className="text-4xl font-semibold tracking-[-0.04em]">
              <DurationText seconds={seconds} format={format} maxUnits={maxUnits} />
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">{new Intl.NumberFormat("en-US").format(seconds)} seconds</p>
          </div>
          <div className="grid gap-3">
            <Slider min={0} max={SLIDER_MAX} step={5} value={[Math.min(seconds, SLIDER_MAX)]} onValueChange={(next) => setSeconds(next[0] ?? 0)} thumbLabels={["Length in seconds"]} />
            <SegmentedControl label="Presets" value={String(seconds)} onValueChange={(next) => setSeconds(Number(next))} options={PRESETS} className="w-fit" />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <SegmentedControl label="Format" value={format} onValueChange={(next) => setFormat(next as DurationFormat)} options={FORMATS} />
            <SegmentedControl label="Units written" value={units} onValueChange={setUnits} options={UNITS} />
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-8 gap-y-2.5 border-t border-border pt-5 text-sm">
            {FORMATS.map((entry) => (
              <div key={entry.value} className="contents">
                <dt className="text-muted-foreground">{entry.label}</dt>
                <dd className="font-medium">
                  <DurationText seconds={seconds} format={entry.value} maxUnits={maxUnits} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Example>

      <Example caption="Video lengths in the player’s own style, on the thumbnail">
        <ul className="grid max-w-xl grid-cols-3 gap-2.5 sm:gap-3">
          {VIDEOS.map((video) => (
            <li key={video.title} className="grid content-start gap-2">
              <div className="relative grid aspect-video place-items-center overflow-hidden rounded-lg border border-border bg-muted">
                <img src={video.image} alt="" width={320} height={180} className="absolute inset-0 size-full object-cover" />
                <span className="relative grid size-6 place-items-center rounded-full bg-background/90 text-foreground shadow-xs sm:size-9">
                  <IconPlay aria-hidden="true" className="size-3 sm:size-4" />
                </span>
                <span className="absolute right-1 bottom-1 rounded bg-foreground px-1 py-0.5 text-[0.625rem] leading-none font-medium text-background sm:right-1.5 sm:bottom-1.5 sm:px-1.5 sm:text-[0.6875rem]">
                  <DurationText seconds={video.length} format="clock" />
                </span>
              </div>
              <p className="text-[0.8125rem] leading-snug font-medium sm:text-sm">{video.title}</p>
            </li>
          ))}
        </ul>
      </Example>

      <div className="grid gap-10 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Example caption="A call log: narrow figures right-aligned, zero reads “0m”, under a minute shows seconds">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call</TableHead>
                  <TableHead className="text-right">Length</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CALLS.map((call) => (
                  <TableRow key={call.who}>
                    <TableCell>
                      <span className="block text-sm font-medium">{call.who}</span>
                      <span className="block text-xs text-muted-foreground">{call.when}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DurationText seconds={call.length} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Example>

        <Example caption="Estimates, spelled out in full">
          <dl className="grid content-start gap-3 rounded-xl border border-border bg-card p-4 text-sm shadow-xs">
            <div className="grid gap-0.5">
              <dt className="text-muted-foreground">Prep</dt>
              <dd className="font-medium">
                <DurationText seconds={1200} format="long" />
              </dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-muted-foreground">Cook</dt>
              <dd className="font-medium">
                <DurationText seconds={4500} format="long" />
              </dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-muted-foreground">Rest, in minutes</dt>
              <dd className="font-medium">
                <DurationText seconds={5400} format="short" largestUnit="minute" />
              </dd>
            </div>
          </dl>
        </Example>
      </div>
    </div>
  );
}
