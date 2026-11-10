"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { QrCode, encodeQr, type QrLevel } from "@rhs-ui/primitives/qr-code";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid min-w-0 grid-cols-1 gap-5 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-6";

const PRESETS: { label: string; value: string }[] = [
  { label: "Link", value: "https://northwind.example/invite/h7q2" },
  { label: "Wi-Fi", value: "WIFI:T:WPA;S:Halcyon Guest;P:low-tide-4411;;" },
  { label: "Contact", value: "BEGIN:VCARD\nVERSION:3.0\nFN:Maya Okafor\nORG:Northwind\nTEL:+31 20 555 0142\nEMAIL:maya@northwind.example\nEND:VCARD" },
  { label: "Too long", value: "A QR code holds a few thousand characters at most. ".repeat(80) },
];

const LEVELS: { value: QrLevel; label: string; about: string }[] = [
  { value: "L", label: "L", about: "7%" },
  { value: "M", label: "M", about: "15%" },
  { value: "Q", label: "Q", about: "25%" },
  { value: "H", label: "H", about: "30%" },
];

/** How many modules wide the code is, or null when the text does not fit. */
function modulesOf(value: string, level: QrLevel): { size: number; version: number } | null {
  if (value === "") return null;
  try {
    const matrix = encodeQr(value, level);
    return { size: matrix.size, version: matrix.version };
  } catch {
    return null;
  }
}

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState("Nothing downloaded yet.");
  const [text, setText] = useState(PRESETS[0]?.value ?? "");
  const [level, setLevel] = useState<QrLevel>("M");
  const live = modulesOf(text, level);

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-10">
      <Example caption="A code with its download buttons. The PNG is only drawn when you ask for it, from the same SVG.">
        <div className={cn(card, "items-center justify-items-center sm:grid-cols-[auto_minmax(0,1fr)] sm:justify-items-start sm:gap-8")}>
          <QrCode
            value="https://northwind.example/invite/h7q2"
            title="northwind.example/invite"
            size={184}
            caption="northwind.example/invite"
            actions
            onDownload={(format, file) => setSaved(`Downloaded qr-code.${format}, ${(file.size / 1024).toFixed(1)} KB.`)}
          />
          <div className="grid max-w-sm gap-4 text-center sm:text-left">
            <div className="grid gap-1">
              <h2 className="text-base font-medium tracking-[-0.02em]">Join Northwind on your phone</h2>
              <p className="text-sm text-muted-foreground">Scan the code to open your invite. It works from a screen or from paper.</p>
            </div>
            <ol className="grid gap-2 text-left text-sm">
              {["Open the camera on your phone", "Point it at the code", "Tap the link that appears"].map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-muted text-xs font-medium tabular-nums">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p role="status" className="text-xs text-muted-foreground">
              {saved}
            </p>
          </div>
        </div>
      </Example>

      <Example caption="Four error correction levels for the same link. A higher level survives more damage and makes a denser code.">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {LEVELS.map((entry) => {
            const info = modulesOf("https://northwind.example/r/4f9c", entry.value);
            return (
              <div key={entry.value} className="grid justify-items-center gap-2">
                <QrCode value="https://northwind.example/r/4f9c" level={entry.value} size={128} title="northwind.example/r/4f9c" />
                <p className="text-center text-xs text-muted-foreground tabular-nums">
                  <strong className="font-medium text-foreground">Level {entry.label}</strong> · {entry.about}
                  <br />
                  {info ? `${info.size} × ${info.size} modules` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </Example>

      <Example caption="Try it: type anything, in any script. The code follows, and a text that is too long says so instead of drawing something that would not scan.">
        <div className={cn(card, "sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start")}>
          <div className="grid min-w-0 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="qr-text">What the code holds</Label>
              <Textarea id="qr-text" rows={4} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} className="max-h-36 font-mono text-xs" />
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <Button key={preset.label} type="button" variant="outline" size="sm" onClick={() => setText(preset.value)}>
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <span className="text-sm leading-none font-medium">
                Error correction
              </span>
              <SegmentedControl className="justify-self-start" label="Error correction level" value={level} onValueChange={(next) => setLevel(next as QrLevel)} options={LEVELS.map((entry) => ({ value: entry.value, label: entry.label }))} />
              <p className="text-xs text-muted-foreground">
                Level {level}: about {LEVELS.find((entry) => entry.value === level)?.about} of the code can be lost and it still scans.
              </p>
            </div>
          </div>
          <div className="grid justify-items-center gap-2 sm:w-48">
            <QrCode value={text} level={level} size={176} title={text.split("\n")[0]?.slice(0, 40) || undefined} />
            <p aria-live="polite" className="text-center text-xs text-muted-foreground tabular-nums">
              {live ? `Version ${live.version} · ${live.size} × ${live.size} modules` : text === "" ? "Type something to encode" : "Does not fit in any QR code"}
            </p>
          </div>
        </div>
      </Example>
    </div>
  );
}
