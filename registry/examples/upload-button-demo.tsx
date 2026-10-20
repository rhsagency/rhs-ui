"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { UploadButton, type RejectedFile, type UploadState } from "@rhs-ui/primitives/upload-button";

/** A pretend upload: it fills over about two and a half seconds, can be cancelled, and settles on success. */
function useFakeUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clear, []);

  const onFiles = (accepted: File[], refused: RejectedFile[]) => {
    setRejected(refused);
    if (!accepted.length) return;
    clear();
    setState("uploading");
    setProgress(0);
    for (let step = 1; step <= 20; step += 1) timers.current.push(window.setTimeout(() => setProgress(step / 20), step * 130));
    timers.current.push(window.setTimeout(() => setState("success"), 2700));
    timers.current.push(window.setTimeout(() => setState("idle"), 5200));
  };
  const onCancel = () => {
    clear();
    setState("idle");
    setProgress(0);
  };
  return { state, progress, rejected, onFiles, onCancel };
}

function Example({ caption, children, wide = false }: { caption: string; children: ReactNode; wide?: boolean }): React.JSX.Element {
  return (
    <div className={wide ? "col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3"}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Refusals({ list }: { list: readonly RejectedFile[] }): React.JSX.Element | null {
  if (!list.length) return null;
  return (
    <ul className="grid gap-1 text-xs text-destructive">
      {list.map((item, index) => (
        <li key={`${item.file.name}-${index}`}>{item.reason}</li>
      ))}
    </ul>
  );
}

const GALLERY: { state: UploadState; caption: string; progress?: number }[] = [
  { state: "idle", caption: "Idle" },
  { state: "uploading", caption: "Uploading", progress: 0.62 },
  { state: "success", caption: "Success" },
  { state: "error", caption: "Error" },
];

export default function Demo(): React.JSX.Element {
  const files = useFakeUpload();
  const logo = useFakeUpload();
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="Choose, drop or paste files. Images and PDFs, up to 5 MB each, four at a time">
        <UploadButton multiple accept="image/*,.pdf" maxBytes={5_000_000} maxFiles={4} onFiles={files.onFiles} state={files.state} progress={files.progress} onCancel={files.onCancel} />
        <Refusals list={files.rejected} />
      </Example>

      <Example caption="One file, solid, with its own words">
        <UploadButton
          variant="default"
          label="Upload logo"
          accept="image/png,image/svg+xml"
          maxBytes={1_000_000}
          labels={{ uploading: "Uploading logo", success: () => "Logo uploaded" }}
          onFiles={logo.onFiles}
          state={logo.state}
          progress={logo.progress}
          onCancel={logo.onCancel}
        />
        <Refusals list={logo.rejected} />
      </Example>

      <Example wide caption="Every state, driven from outside with state and progress">
        <div className="flex flex-wrap gap-x-8 gap-y-5">
          {GALLERY.map(({ state, caption, progress }) => (
            <div key={state} className="grid min-w-0 justify-items-start gap-2">
              <UploadButton multiple count={3} state={state} progress={progress} onFiles={() => undefined} />
              <span className="text-xs text-muted-foreground">{caption}</span>
            </div>
          ))}
        </div>
      </Example>
    </div>
  );
}
