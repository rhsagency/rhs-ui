"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { DownloadButton, type DownloadStatus } from "@rhs-ui/primitives/download-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The address of a file made on the spot. The button saves it straight away, so it is let go of after that. */
function fileUrl(file: Blob): string {
  const url = URL.createObjectURL(file);
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return url;
}

const MARKS = [
  { x: 12, d: "M10 38V14l24 24V14" },
  { x: 92, d: "M10 14h24M22 14v24" },
  { x: 172, d: "M12 26a12 12 0 1 1 24 0a12 12 0 1 1-24 0" },
  { x: 252, d: "M10 38l12-24 12 24z" },
];
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 64" width="320" height="64">${MARKS.map(
  ({ x, d }) => `<g transform="translate(${x} 6)"><rect width="46" height="52" rx="12" fill="#111"/><path d="${d}" transform="translate(0 0)" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`,
).join("")}</svg>`;
const LOGO_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LOGO_SVG)}`;
const LOGO_BYTES = new Blob([LOGO_SVG]).size;

const CUSTOMERS = ["Halcyon Labs", "Kestrel Foods", "Lumen Studio", "Polder Bikes", "Northwind Trading", "Ardent Print"];
function ordersCsv(): string {
  const rows = Array.from({ length: 90 }, (_, index) => `NW-${1041 + index},${CUSTOMERS[index % CUSTOMERS.length]},${(180 + ((index * 137) % 2900)).toFixed(2)},EUR,2026-10-${String(1 + (index % 20)).padStart(2, "0")}`);
  return ["Order,Customer,Total,Currency,Date", ...rows].join("\n");
}

const STAFF = ["Anna de Vries", "Bram Koster", "Chloe Meijer", "Daan Bakker", "Eva Smit", "Finn Mulder", "Gwen Vos", "Hugo Peters"];
function payrollCsv(): string {
  const rows = Array.from({ length: 36 }, (_, index) => `${STAFF[index % STAFF.length]},NW-${210 + index},${(3150 + ((index * 211) % 2900)).toFixed(2)},EUR,2025-${String(1 + (index % 12)).padStart(2, "0")}-25`);
  return ["Employee,Number,Gross,Currency,Pay date", ...rows].join("\n");
}

const SECTIONS = ["Summary", "Revenue", "Customers", "Outlook"];
/** A short PDF written by hand (ASCII, so every offset is a string index), so the button saves a file that really opens. */
function reportPdf(): string {
  // Objects 1 and 2 are the catalog and the page tree, then a page and its content for each section, then the font.
  const font = 3 + SECTIONS.length * 2;
  const kids = SECTIONS.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${kids}] /Count ${SECTIONS.length} >>`];
  SECTIONS.forEach((section, index) => {
    const text = `BT /F1 26 Tf 56 760 Td (Northwind annual report 2025) Tj /F1 16 Tf 0 -36 Td (${section}) Tj ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${4 + index * 2} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`);
    objects.push(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((body, index) => {
    const at = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const table = offsets.map((at) => `${String(at).padStart(10, "0")} 00000 n \n`).join("");
  return `${pdf}xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${table}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pdf.length}\n%%EOF\n`;
}
const REPORT_PDF = reportPdf();
const REPORT_BYTES = new Blob([REPORT_PDF]).size;
const PAYROLL_CSV = payrollCsv();
const PAYROLL_BYTES = new Blob([PAYROLL_CSV]).size;

const GALLERY: { status: DownloadStatus; caption: string }[] = [
  { status: "ready", caption: "Ready" },
  { status: "preparing", caption: "Preparing" },
  { status: "done", caption: "Done" },
  { status: "failed", caption: "Failed, with a retry" },
];

function Example({ caption, children, wide = false }: { caption: string; children: ReactNode; wide?: boolean }): React.JSX.Element {
  return (
    <div className={wide ? "col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3"}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [exportBytes, setExportBytes] = useState<number | undefined>(undefined);
  const [reportBytes, setReportBytes] = useState<number | undefined>(undefined);
  const attempts = useRef(0);
  // The size of a report arrives after a request: the button fills it in the moment it is known.
  useEffect(() => {
    const timer = window.setTimeout(() => setReportBytes(REPORT_BYTES), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="A file that exists: a real link">
        <DownloadButton href={LOGO_URL} fileName="Northwind logo pack.svg" bytes={LOGO_BYTES} />
      </Example>

      <Example caption="Built when asked: preparing, then downloaded">
        <DownloadButton
          variant="default"
          fileName="Orders October.csv"
          bytes={exportBytes}
          onDownload={async () => {
            await wait(1300);
            const blob = new Blob([ordersCsv()], { type: "text/csv" });
            setExportBytes(blob.size);
            return fileUrl(blob);
          }}
        />
      </Example>

      <Example caption="Fails the first time, and the retry works">
        <DownloadButton
          fileName="Payroll 2025.csv"
          bytes={PAYROLL_BYTES}
          onDownload={async () => {
            attempts.current += 1;
            await wait(1100);
            if (attempts.current % 2 === 1) throw new Error("The export service did not answer.");
            return fileUrl(new Blob([PAYROLL_CSV], { type: "text/csv" }));
          }}
        />
      </Example>

      <Example caption="The size is not known yet, and fills in when it is">
        <DownloadButton
          variant="secondary"
          fileName="Annual report 2025.pdf"
          bytes={reportBytes}
          onDownload={async () => {
            await wait(900);
            return fileUrl(new Blob([REPORT_PDF], { type: "application/pdf" }));
          }}
        />
      </Example>

      <Example wide caption="Every state, driven from outside with status">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {GALLERY.map(({ status, caption }) => (
            <div key={status} className="grid min-w-0 justify-items-start gap-2">
              <DownloadButton status={status} fileName="Q3 report.pdf" bytes={2_400_000} onDownload={() => undefined} />
              <span className="text-xs text-muted-foreground">{caption}</span>
            </div>
          ))}
        </div>
      </Example>
    </div>
  );
}
