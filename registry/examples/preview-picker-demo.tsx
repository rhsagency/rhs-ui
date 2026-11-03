"use client";

import { useState, type ReactNode } from "react";

import { PreviewPicker, type PreviewOption } from "@rhs-ui/primitives/preview-picker";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A grey line of text. */
const Line = ({ w = "100%", tone = "bg-foreground/15" }: { w?: string; tone?: string }) => <span className={`block h-1.5 rounded-full ${tone}`} style={{ width: w }} />;

/** The sheet an email is drawn on: the page behind, and a column in the middle. */
function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-[6%]">
      <div className={`flex h-full w-[min(62%,22rem)] min-w-[11rem] flex-col gap-2 overflow-hidden rounded-md border border-border bg-background p-[6%] shadow-sm ${className}`}>{children}</div>
    </div>
  );
}

const Logo = ({ centred }: { centred?: boolean }) => (
  <span className={`flex items-center gap-1.5 ${centred ? "justify-center" : ""}`}>
    <span className="size-3.5 rounded-[4px] bg-foreground" />
    <span className="h-1.5 w-12 rounded-full bg-foreground/60" />
  </span>
);

const Button = ({ centred, tone = "bg-foreground" }: { centred?: boolean; tone?: string }) => (
  <span className={`flex ${centred ? "justify-center" : ""}`}>
    <span className={`h-5 w-20 rounded-md ${tone}`} />
  </span>
);

const Hero = () => (
  <span className="relative block h-[22%] min-h-9 shrink-0 overflow-hidden rounded-md bg-foreground/10">
    <span className="absolute right-[18%] bottom-[22%] size-4 rounded-full bg-foreground/20" />
    <span className="absolute -bottom-3 left-[10%] h-10 w-16 rotate-45 rounded-sm bg-foreground/15" />
    <span className="absolute -bottom-4 left-[38%] h-12 w-20 rotate-45 rounded-sm bg-foreground/25" />
  </span>
);

/** Four ways to lay out the same email, drawn as plain shapes so they scale with the pane. */
function EmailLayout({ kind }: { kind: string }): React.JSX.Element {
  if (kind === "minimal") {
    return (
      <Sheet>
        <Logo />
        <Line w="82%" tone="bg-foreground/70" />
        <Line w="58%" tone="bg-foreground/70" />
        <span className="mt-1 grid gap-[0.45rem]">
          <Line />
          <Line />
          <Line w="92%" />
          <Line w="74%" />
        </span>
        <span className="mt-1 block h-px w-14 bg-foreground/50" />
        <span className="mt-auto grid gap-1.5">
          <Line w="46%" />
          <Line w="30%" />
        </span>
      </Sheet>
    );
  }
  if (kind === "digest") {
    return (
      <Sheet>
        <Logo />
        <Line w="62%" tone="bg-foreground/70" />
        {[0, 1, 2].map((row) => (
          <span key={row} className="flex items-center gap-2.5 border-t border-border pt-2">
            <span className="size-7 shrink-0 rounded-md bg-foreground/10" />
            <span className="grid min-w-0 flex-1 gap-1.5">
              <Line w="78%" tone="bg-foreground/55" />
              <Line w="52%" />
            </span>
          </span>
        ))}
        <span className="mt-auto grid gap-1.5 pt-2">
          <Line w="40%" />
        </span>
      </Sheet>
    );
  }
  if (kind === "announcement") {
    return (
      <Sheet className="!p-0">
        <span className="grid gap-2 bg-foreground px-[8%] pt-[8%] pb-[9%]">
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-[4px] bg-background" />
            <span className="h-1.5 w-12 rounded-full bg-background/60" />
          </span>
          <span className="mt-2 block h-2.5 w-[88%] rounded-full bg-background" />
          <span className="block h-2.5 w-[64%] rounded-full bg-background" />
          <span className="mt-1 block h-5 w-20 rounded-md bg-background" />
        </span>
        <span className="grid gap-[0.45rem] px-[8%] pt-1">
          <Line />
          <Line w="88%" />
          <Line w="70%" />
        </span>
        <span className="mt-auto grid gap-1.5 px-[8%] pb-[8%]">
          <Line w="38%" />
        </span>
      </Sheet>
    );
  }
  return (
    <Sheet>
      <Logo centred />
      <Hero />
      <span className="grid justify-items-center gap-[0.45rem]">
        <Line w="70%" tone="bg-foreground/70" />
        <Line w="88%" />
        <Line w="80%" />
      </span>
      <Button centred />
      <span className="mt-auto grid justify-items-center gap-1.5">
        <Line w="44%" />
      </span>
    </Sheet>
  );
}

const LAYOUTS: readonly PreviewOption[] = [
  { value: "classic", label: "Classic", description: "A centred logo, one hero image, a short message and a button." },
  { value: "minimal", label: "Minimal", description: "Plain text on white, like a note from a person." },
  { value: "digest", label: "Digest", description: "A heading and a list of three stories with a picture each." },
  { value: "announcement", label: "Announcement", description: "A bold banner with the news and one clear button." },
];

const FORMATS: readonly PreviewOption[] = [
  { value: "csv", label: "CSV", description: "One row per order, opens in any spreadsheet." },
  { value: "json", label: "JSON", description: "Nested orders with their lines, for developers." },
  { value: "pdf", label: "PDF report", description: "A printable summary with totals." },
  { value: "xlsx", label: "Excel workbook", description: "Available on the Business plan.", disabled: true },
];

function Code({ children }: { children: string }): React.JSX.Element {
  return <pre className="absolute inset-0 overflow-hidden p-[5%] font-mono text-[0.6875rem] leading-4 whitespace-pre text-foreground/80 @[45rem]:text-xs @[45rem]:leading-6">{children}</pre>;
}

function ExportPreview({ kind }: { kind: string }): React.JSX.Element {
  if (kind === "json") {
    return (
      <Code>{`{
  "orders": [
    {
      "number": "NW-48213",
      "placed": "2026-10-27",
      "total": 214.5,
      "lines": [
        { "sku": "TENT-2P", "qty": 1 },
        { "sku": "MAT-AIR", "qty": 2 }
      ]
    }
  ]
}`}</Code>
    );
  }
  if (kind === "pdf") {
    return (
      <Sheet>
        <span className="flex items-baseline justify-between">
          <span className="h-2 w-16 rounded-full bg-foreground/70" />
          <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
        </span>
        {[0, 1, 2, 3, 4].map((row) => (
          <span key={row} className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <Line w={`${58 - row * 6}%`} />
            <span className="h-1.5 w-8 shrink-0 rounded-full bg-foreground/30" />
          </span>
        ))}
        <span className="mt-auto flex items-center justify-between border-t border-foreground/40 pt-2">
          <span className="h-1.5 w-12 rounded-full bg-foreground/60" />
          <span className="h-2 w-14 rounded-full bg-foreground/80" />
        </span>
      </Sheet>
    );
  }
  return (
    <Code>{`number,placed,total,lines
NW-48213,2026-10-27,214.50,3
NW-48214,2026-10-27,89.00,1
NW-48217,2026-10-28,342.95,5
NW-48219,2026-10-29,19.90,1
NW-48222,2026-10-30,128.00,2
NW-48225,2026-10-31,57.25,2`}</Code>
  );
}

export default function Demo(): React.JSX.Element {
  const [layout, setLayout] = useState<string | null>("classic");
  const [format, setFormat] = useState<string | null>(null);
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-14 px-5 py-10 sm:px-8">
      <Example caption="Try it: point at an option, or move with the arrow keys, to preview it. Space or a click chooses. Under 720px the preview folds under the list.">
        <PreviewPicker
          label="Email layout"
          options={LAYOUTS}
          value={layout}
          onValueChange={setLayout}
          renderPreview={(option) => <EmailLayout kind={option.value} />}
          previewClassName="aspect-[4/3] @[45rem]:aspect-[16/10]"
          name="layout"
        />
      </Example>

      <Example caption="Nothing chosen yet, a preview in text, and an option that is not available on this plan">
        <PreviewPicker
          label="Export format"
          options={FORMATS}
          value={format}
          onValueChange={setFormat}
          renderPreview={(option) => <ExportPreview kind={option.value} />}
          previewClassName="aspect-[4/3] @[45rem]:aspect-[16/9]"
        />
      </Example>
    </div>
  );
}
