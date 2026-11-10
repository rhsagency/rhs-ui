import type { ReactNode } from "react";

import { FileTypeIcon, fileTypeLabel, type FileFamily } from "@rhs-ui/primitives/file-type-icon";

const FILES = [
  { name: "report-final.xlsx", note: "Q3 revenue model · 2.4 MB · edited today" },
  { name: "Brand guidelines.pdf", note: "42 pages · 8.1 MB · edited yesterday" },
  { name: "Kickoff deck.pptx", note: "Northwind rollout · 18 MB · 3 days ago" },
  { name: "hero-photo.jpg", note: "5120 × 3413 · 3.6 MB · 1 week ago" },
  { name: "Onboarding walkthrough.mp4", note: "4 min 12 s · 96 MB · 1 week ago" },
  { name: "Low Tide (master).wav", note: "3 min 44 s · 38 MB · 2 weeks ago" },
  { name: "assets-2026-10.zip", note: "212 files · 64 MB · 2 weeks ago" },
  { name: "tailwind.config.ts", note: "1.2 KB · 3 weeks ago" },
  { name: "Invoice 0412", mime: "application/pdf", note: "No extension in the name: the type says PDF" },
  { name: "mystery.xyz9", note: "A format nobody mapped: the plain page" },
] as const;

const FAMILIES: { family: FileFamily; title: string; examples: string; sample: string }[] = [
  { family: "document", title: "Document", examples: "pdf, docx, txt, md", sample: "notes.docx" },
  { family: "sheet", title: "Sheet", examples: "xlsx, csv, ods", sample: "budget.xlsx" },
  { family: "slide", title: "Slide", examples: "pptx, key, odp", sample: "pitch.pptx" },
  { family: "image", title: "Image", examples: "png, jpg, svg, fig", sample: "cover.png" },
  { family: "video", title: "Video", examples: "mp4, mov, webm", sample: "demo.mp4" },
  { family: "audio", title: "Audio", examples: "mp3, wav, flac", sample: "mix.mp3" },
  { family: "archive", title: "Archive", examples: "zip, tar, 7z, dmg", sample: "backup.zip" },
  { family: "code", title: "Code", examples: "ts, py, json, html", sample: "index.tsx" },
  { family: "unknown", title: "Unknown", examples: "anything else", sample: "file.abc1" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-10">
      <Example caption="Picked from the extension, or from the MIME type when the name has none. The icon is hidden from a screen reader: the name beside it says what the file is.">
        <ul className="grid min-w-0 divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {FILES.map((file) => (
            <li key={file.name} className="flex items-center gap-4 px-4 py-3">
              <FileTypeIcon name={file.name} mime={"mime" in file ? file.mime : undefined} />
              <div className="grid min-w-0 gap-0.5">
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="truncate text-xs text-muted-foreground">{file.note}</span>
              </div>
            </li>
          ))}
        </ul>
      </Example>

      <Example caption="Nine families at the three sizes. Each has a glyph of its own, so none depends on colour. The small size leaves the extension off.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FAMILIES.map((entry) => (
            <div key={entry.family} className="grid min-w-0 content-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="grid gap-0.5">
                <h2 className="text-sm font-medium tracking-[-0.01em]">{entry.title}</h2>
                <p className="truncate text-xs text-muted-foreground">{entry.examples}</p>
              </div>
              <div className="flex items-end gap-4">
                <FileTypeIcon name={entry.sample} family={entry.family} size="sm" />
                <FileTypeIcon name={entry.sample} family={entry.family} size="md" />
                <FileTypeIcon name={entry.sample} family={entry.family} size="lg" label={fileTypeLabel(entry.sample)} />
              </div>
            </div>
          ))}
        </div>
      </Example>
    </div>
  );
}
