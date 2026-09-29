"use client";

import { useId, useRef, useState, type DragEvent } from "react";

import { IconClose, IconFile, IconUpload } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  files?: readonly File[];
  onFilesChange?: (files: File[]) => void;
  /** Like the input's accept: ".pdf,image/*". */
  accept?: string;
  /** Largest file in bytes. */
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  /** What to drop, in words: "PDF or image, up to 10 MB". */
  hint?: string;
  label?: string;
  name?: string;
  className?: string;
}

const size = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`);

function accepts(file: File, accept?: string): boolean {
  if (!accept) return true;
  return accept.split(",").map((rule) => rule.trim().toLowerCase()).some((rule) => (rule.startsWith(".") ? file.name.toLowerCase().endsWith(rule) : rule.endsWith("/*") ? file.type.startsWith(rule.slice(0, -1)) : file.type === rule));
}

/**
 * Drop files or click to choose them. It is a real file input underneath, so
 * the keyboard and screen readers get the native control; the zone only adds
 * the drop target. Wrong types and oversized files are refused with a
 * reason, and every chosen file can be removed again.
 */
export function FileDropzone({ files, onFilesChange, accept, maxSize, maxFiles = Number.POSITIVE_INFINITY, multiple = true, hint, label = "Upload files", name, className }: FileDropzoneProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const current = files ? [...files] : own;
  const set = (next: File[]) => {
    if (!files) setOwn(next);
    onFilesChange?.(next);
  };
  const add = (list: FileList | null) => {
    if (!list) return;
    const refused: string[] = [];
    const taken: File[] = [];
    for (const file of Array.from(list)) {
      if (!accepts(file, accept)) refused.push(`${file.name}: this type is not accepted.`);
      else if (maxSize && file.size > maxSize) refused.push(`${file.name}: larger than ${size(maxSize)}.`);
      else if (current.length + taken.length >= maxFiles) refused.push(`${file.name}: at most ${maxFiles} files.`);
      else taken.push(file);
    }
    setProblems(refused);
    set(multiple ? [...current, ...taken] : taken.slice(0, 1));
  };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setOver(false);
    add(event.dataTransfer.files);
  };
  return (
    <div data-slot="file-dropzone" className={cn("grid w-full gap-3", className)}>
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input px-6 py-8 text-center transition-colors duration-150 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40",
          over ? "border-foreground bg-muted" : "hover:bg-muted/50",
        )}
      >
        <span className="grid size-10 place-items-center rounded-full border border-border bg-background">
          <IconUpload size={18} />
        </span>
        <span className="text-sm font-medium">{over ? "Drop to add" : label}</span>
        <span className="text-xs text-muted-foreground">Drag files here or click to choose{hint ? `. ${hint}` : ""}</span>
        <input ref={input} id={id} name={name} type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(event) => { add(event.target.files); event.target.value = ""; }} />
      </label>
      {problems.length ? (
        <ul role="status" className="grid gap-1 text-xs text-destructive">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}
      {current.length ? (
        <ul className="grid gap-2" aria-label="Chosen files">
          {current.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              <IconFile size={16} className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{size(file.size)}</span>
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => set(current.filter((_, at) => at !== index))} className="grid size-6 place-items-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                <IconClose size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
