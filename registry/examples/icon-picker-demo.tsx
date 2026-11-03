"use client";

import { useState, type ReactNode } from "react";

import {
  IconAnchor,
  IconBag,
  IconBell,
  IconBike,
  IconBook,
  IconBookmark,
  IconBrain,
  IconBriefcase,
  IconCalendar,
  IconCamera,
  IconChartBar,
  IconCloud,
  IconCode,
  IconCoffee,
  IconCompass,
  IconCpu,
  IconDatabase,
  IconFlag,
  IconFlask,
  IconFolder,
  IconGamepad,
  IconGift,
  IconGlobe,
  IconGraduationCap,
  IconHeadphones,
  IconHeart,
  IconHome,
  IconIdea,
  IconKey,
  IconLaptop,
  IconLayers,
  IconLeaf,
  IconLock,
  IconMail,
  IconMap,
  IconMessage,
  IconMic,
  IconMountain,
  IconMusic,
  IconPalette,
  IconPlane,
  IconPuzzle,
  IconRocket,
  IconShield,
  IconSmile,
  IconSparkle,
  IconStar,
  IconSun,
  IconTag,
  IconTarget,
  IconTrophy,
  IconTruck,
  IconUsers,
  IconWallet,
  IconWrench,
  IconZap,
} from "@rhs-ui/icons";
import { IconPicker } from "@rhs-ui/primitives/icon-picker";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";

/** The icons a project can wear. A subset of the RHS UI set, in the order people look for them. */
const ICONS = {
  folder: <IconFolder />,
  home: <IconHome />,
  briefcase: <IconBriefcase />,
  rocket: <IconRocket />,
  flask: <IconFlask />,
  idea: <IconIdea />,
  target: <IconTarget />,
  trophy: <IconTrophy />,
  star: <IconStar />,
  heart: <IconHeart />,
  sparkle: <IconSparkle />,
  zap: <IconZap />,
  chart: <IconChartBar />,
  database: <IconDatabase />,
  code: <IconCode />,
  cpu: <IconCpu />,
  laptop: <IconLaptop />,
  cloud: <IconCloud />,
  lock: <IconLock />,
  shield: <IconShield />,
  key: <IconKey />,
  wrench: <IconWrench />,
  layers: <IconLayers />,
  puzzle: <IconPuzzle />,
  mail: <IconMail />,
  message: <IconMessage />,
  users: <IconUsers />,
  bell: <IconBell />,
  calendar: <IconCalendar />,
  bookmark: <IconBookmark />,
  flag: <IconFlag />,
  tag: <IconTag />,
  bag: <IconBag />,
  wallet: <IconWallet />,
  gift: <IconGift />,
  truck: <IconTruck />,
  book: <IconBook />,
  "graduation-cap": <IconGraduationCap />,
  brain: <IconBrain />,
  palette: <IconPalette />,
  camera: <IconCamera />,
  music: <IconMusic />,
  headphones: <IconHeadphones />,
  mic: <IconMic />,
  gamepad: <IconGamepad />,
  globe: <IconGlobe />,
  map: <IconMap />,
  compass: <IconCompass />,
  plane: <IconPlane />,
  bike: <IconBike />,
  mountain: <IconMountain />,
  leaf: <IconLeaf />,
  sun: <IconSun />,
  coffee: <IconCoffee />,
  anchor: <IconAnchor />,
  smile: <IconSmile />,
} as const;

const LABELS = {
  chart: "Bar chart",
  cpu: "Chip",
  idea: "Light bulb",
  zap: "Lightning bolt",
  bag: "Shopping bag",
  "graduation-cap": "Graduation cap",
  mic: "Microphone",
  home: "House",
} as const;

const KEYWORDS = {
  folder: ["directory", "files", "documents"],
  briefcase: ["work", "job", "business"],
  rocket: ["launch", "startup", "ship"],
  flask: ["lab", "experiment", "science"],
  idea: ["lightbulb", "insight", "tip"],
  target: ["goal", "aim", "focus"],
  trophy: ["win", "award", "prize"],
  chart: ["analytics", "stats", "graph", "report"],
  database: ["data", "storage", "sql"],
  code: ["developer", "engineering", "programming"],
  lock: ["private", "secure", "password"],
  shield: ["security", "protect", "safe"],
  mail: ["email", "inbox", "newsletter"],
  message: ["chat", "comment", "conversation"],
  users: ["team", "people", "group"],
  bag: ["shop", "store", "retail"],
  wallet: ["payment", "money", "billing"],
  truck: ["delivery", "shipping", "logistics"],
  "graduation-cap": ["education", "course", "learning", "school"],
  palette: ["design", "colour", "art", "brand"],
  globe: ["world", "international", "web"],
  plane: ["travel", "flight", "trip"],
  leaf: ["nature", "sustainability", "eco"],
  coffee: ["break", "cafe", "morning"],
} as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Reported({ value }: { value: string | null }): React.JSX.Element {
  return (
    <p role="status" className="flex items-baseline gap-2 text-xs text-muted-foreground">
      <span>Reported</span>
      <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(value)}</code>
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [project, setProject] = useState<string | null>("rocket");
  const [folder, setFolder] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>("graduation-cap");
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <Example caption="Try it: type to search (“launch”, “team”), arrows move through the grid, Enter chooses, Escape closes.">
        <div className="grid min-h-[38rem] content-start gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em]">New project</h2>
            <p className="mt-1 text-sm text-muted-foreground">Projects show up in the sidebar with the icon you pick.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" defaultValue="Kestrel rebrand" />
          </div>
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label id="project-icon-label">Icon</Label>
              <Reported value={project} />
            </div>
            <IconPicker id="project-icon" aria-labelledby="project-icon-label" icons={ICONS} labels={LABELS} keywords={KEYWORDS} value={project} onValueChange={setProject} defaultOpen />
          </div>
        </div>
      </Example>

      <div className="grid min-w-0 content-start gap-10">
        <Example caption="With a None cell, so the icon is optional. Nothing chosen yet.">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label id="folder-icon-label">Folder icon</Label>
              <Reported value={folder} />
            </div>
            <IconPicker id="folder-icon" aria-labelledby="folder-icon-label" icons={ICONS} labels={LABELS} keywords={KEYWORDS} value={folder} onValueChange={setFolder} allowNone messages={{ placeholder: "No icon" }} />
          </div>
        </Example>
        <Example caption="Eight to a row, and the words in another language.">
          <div className="grid gap-2">
            <Label id="category-icon-label">Kategorie-Symbol</Label>
            <IconPicker
              id="category-icon"
              aria-labelledby="category-icon-label"
              icons={ICONS}
              labels={LABELS}
              keywords={KEYWORDS}
              columns={8}
              value={category}
              onValueChange={setCategory}
              messages={{
                placeholder: "Symbol wählen",
                search: "Symbole suchen",
                list: "Symbole",
                count: (count) => `${count} Symbole`,
                empty: (query) => `Kein Symbol passt zu „${query}“`,
              }}
            />
          </div>
        </Example>
        <Example caption="Invalid, and disabled.">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label id="team-icon-label">Team icon</Label>
              <IconPicker id="team-icon" aria-labelledby="team-icon-label" icons={ICONS} labels={LABELS} invalid aria-describedby="team-icon-error" />
              <p id="team-icon-error" className="text-xs font-medium text-destructive">
                Choose an icon so the team is easy to spot.
              </p>
            </div>
            <IconPicker icons={ICONS} labels={LABELS} defaultValue="lock" disabled aria-label="Locked icon" />
          </div>
        </Example>
      </div>
    </div>
  );
}
