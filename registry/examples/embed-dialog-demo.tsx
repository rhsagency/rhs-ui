"use client";

import { useState, type ReactNode } from "react";

import { EmbedDialog, EmbedPanel, type EmbedSettings } from "@rhs-ui/application/embed-dialog";
import { escapeAttribute, iframeSnippet } from "@rhs-ui/application/embed-dialog/snippet";
import { IconChartBar, IconCode } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

const REGIONS: readonly (readonly [string, number, string])[] = [
  ["Northern Europe", 4.2, "4.2M"],
  ["Western Europe", 3.6, "3.6M"],
  ["North America", 5.4, "5.4M"],
  ["Asia Pacific", 2.8, "2.8M"],
];

/** What the embed looks like, drawn from the settings: the dialog's preview shows the theme and the size people chose. It fills whatever box it is given, as an embedded page does. */
function Chart({ settings }: { settings: EmbedSettings }): React.JSX.Element {
  const theme = settings.theme === "dark" ? "dark" : settings.theme === "light" ? "light" : "";
  return (
    <div className={cn(theme, "grid size-full content-center gap-3 overflow-hidden bg-background p-4 text-foreground")}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold tracking-[-0.01em]">Revenue by region</p>
        <p className="text-[0.6875rem] text-muted-foreground">Q3 2026, EUR</p>
      </div>
      <div className="grid gap-2">
        {REGIONS.map(([name, value, label]) => (
          <div key={name} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-[0.6875rem]">
            <span className="truncate text-muted-foreground">{name}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-foreground" style={{ width: `${(value / 5.4) * 100}%` }} />
            </span>
            <span className="text-right font-medium tabular-nums">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const build = (settings: EmbedSettings) => iframeSnippet(settings, { src: "https://charts.northwind.dev/embed/revenue-by-region?range=q3&currency=eur", title: "Revenue by region" });

/** A script tag instead of a frame: whatever your product embeds with. Every value that goes into an attribute is escaped. */
const buildWidget = ({ theme, responsive, width, height }: EmbedSettings) =>
  [
    "<script",
    '  async src="https://widgets.halcyon.dev/embed.js"',
    '  data-widget="status"',
    `  data-title="${escapeAttribute('Halcyon "Orbit" status & uptime')}"`,
    `  data-theme="${escapeAttribute(theme)}"`,
    `  data-size="${responsive ? "fluid" : `${width}x${height}`}"`,
    "></script>",
  ].join("\n");

export default function Demo(): React.JSX.Element {
  const [copied, setCopied] = useState("Nothing copied yet.");

  return (
    <div className="grid w-full gap-10">
      <Case caption="A chart with an Embed button. Change the size, switch to Responsive, pick a theme: the code and the preview follow, and the copy button confirms. The title has quotes and an ampersand in it where the code is a script tag; they are escaped, so they cannot break out of their attribute.">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-card px-4 py-4 text-card-foreground shadow-xs sm:px-5">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-5">
            <IconChartBar />
          </span>
          <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
            <h2 className="text-sm font-semibold tracking-[-0.01em]">Revenue by region</h2>
            <p className="text-xs text-muted-foreground">Updated 10 Nov 2026 · public to anyone with the link</p>
          </div>
          <EmbedDialog
            trigger={
              <Button variant="outline">
                <IconCode />
                Embed
              </Button>
            }
            labels={{ title: "Embed this chart", description: "Paste the code where the chart should appear: a blog post, a wiki, a status page." }}
            buildSnippet={build}
            preview={(settings) => <Chart settings={settings} />}
            onCopy={() => setCopied("Copied the code to the clipboard.")}
          />
        </div>
        <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
          {copied}
        </p>
      </Case>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
        <Case caption="A fixed size, with a preview. The frame is as big as the embed will be, shrunk to fit the room, and says by how much.">
          <Surface>
            <EmbedPanel
              standalone
              labels={{ title: "Embed this chart", description: "Paste the code where the chart should appear." }}
              defaults={{ width: 640, height: 360 }}
              buildSnippet={build}
              preview={(settings) => <Chart settings={settings} />}
            />
          </Surface>
        </Case>
        <Case caption="Responsive, dark, and a script tag instead of a frame. controls keeps width and height out of it, and the shape is read from the defaults.">
          <Surface>
            <EmbedPanel
              standalone
              labels={{ title: "Embed the status badge", description: "One script tag. It draws itself where you put it." }}
              defaults={{ width: 480, height: 270, theme: "dark", responsive: true }}
              controls={["theme", "responsive"]}
              buildSnippet={buildWidget}
              preview={(settings) => <Chart settings={settings} />}
            />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The dialog a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm">{children}</div>;
}
