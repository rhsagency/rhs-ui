"use client";

import { useEffect, useRef, useState } from "react";

import { DocumentUploadRow, type DocumentFile, type DocumentStatus } from "@rhs-ui/application/document-upload-row";
import { IconFileText, IconHome, IconIdCard, IconLandmark } from "@rhs-ui/icons";

type DocId = "passport" | "address" | "statement" | "vat";

interface State {
  file: DocumentFile | null;
  status: DocumentStatus;
  progress: number;
  error?: string;
}

const INITIAL: Record<DocId, State> = {
  passport: { file: { name: "passport-scan.pdf", size: 2_410_000 }, status: "uploaded", progress: 100 },
  address: { file: { name: "utility-bill-october.pdf", size: 1_180_000 }, status: "uploading", progress: 62 },
  statement: { file: null, status: "missing", progress: 0 },
  vat: { file: { name: "vat-certificate.jpg", size: 812_000 }, status: "attention", progress: 100, error: "The photo is too blurry to read the number. Upload a sharper scan." },
};

const TEN_MB = 10_000_000;

export default function Demo(): React.JSX.Element {
  const [docs, setDocs] = useState<Record<DocId, State>>(INITIAL);
  const timers = useRef<Partial<Record<DocId, number>>>({});

  /** Stands in for an upload: it moves a few percent at a time until it is done. A real app reports the progress of its own request. */
  function run(id: DocId, step: number) {
    window.clearInterval(timers.current[id]);
    timers.current[id] = window.setInterval(() => {
      setDocs((current) => {
        const at = current[id];
        const next = Math.min(100, at.progress + step);
        if (next >= 100) window.clearInterval(timers.current[id]);
        return { ...current, [id]: { ...at, progress: next, status: next >= 100 ? "uploaded" : "uploading" } };
      });
    }, 280);
  }

  // The proof of address is mid-upload when the demo opens, so the percentage can be seen moving.
  useEffect(() => {
    run("address", 3);
    const own = timers.current;
    return () => {
      for (const timer of Object.values(own)) window.clearInterval(timer);
    };
  }, []);

  function change(id: DocId, next: File | null) {
    window.clearInterval(timers.current[id]);
    if (!next) {
      setDocs((current) => ({ ...current, [id]: { file: null, status: "missing", progress: 0 } }));
      return;
    }
    setDocs((current) => ({ ...current, [id]: { file: { name: next.name, size: next.size }, status: "uploading", progress: 0 } }));
    run(id, 12);
  }

  const ready = Object.values(docs).filter((doc) => doc.status === "uploaded").length;
  const row = (id: DocId) => ({ file: docs[id].file, status: docs[id].status, progress: docs[id].progress, error: docs[id].error, onFileChange: (next: File | null) => change(id, next) });

  return (
    <div className="w-full">
      <section aria-labelledby="verify-title" className="mx-auto grid max-w-2xl gap-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h2 id="verify-title" className="text-lg font-semibold tracking-[-0.02em]">
              Verify your business
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">We need these documents to open your account.</p>
          </div>
          <p role="status" className="text-sm text-muted-foreground tabular-nums">
            {ready} of 4 ready
          </p>
        </div>

        <ul className="grid gap-3">
          <li>
            <DocumentUploadRow label="Passport or ID card" description="PDF or photo, up to 10 MB" accept=".pdf,image/*" maxSize={TEN_MB} required icon={<IconIdCard />} {...row("passport")} />
          </li>
          <li>
            <DocumentUploadRow label="Proof of address" description="A utility bill or bank statement from the last 3 months. PDF or photo, up to 10 MB." accept=".pdf,image/*" maxSize={TEN_MB} required icon={<IconHome />} {...row("address")} />
          </li>
          <li>
            <DocumentUploadRow label="Bank statement" description="Helps us approve you faster. PDF only, up to 5 MB." accept=".pdf" maxSize={5_000_000} icon={<IconLandmark />} {...row("statement")} />
          </li>
          <li>
            <DocumentUploadRow label="VAT registration certificate" description="PDF or photo, up to 10 MB" accept=".pdf,image/*" maxSize={TEN_MB} required icon={<IconFileText />} {...row("vat")} />
          </li>
        </ul>
        <p className="text-xs leading-relaxed text-muted-foreground">Choose a file or drop one on its row. A file of the wrong type, or over the limit, is turned away with the reason before anything is uploaded.</p>
      </section>
    </div>
  );
}
