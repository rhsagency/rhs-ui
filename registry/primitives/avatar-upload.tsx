"use client";

import { useEffect, useId, useRef, useState } from "react";

import { IconCamera, IconTrash } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface AvatarUploadProps {
  /** The current picture URL, or null for initials. */
  value: string | null;
  /** Called with the chosen file; upload it and pass the new URL back as value. */
  onFile: (file: File) => Promise<void> | void;
  onRemove?: () => void;
  /** Initials shown without a picture. */
  initials: string;
  /** Largest file in megabytes. */
  maxSizeMb?: number;
  className?: string;
}

/**
 * Change a profile picture: the current one large, a preview the moment a
 * file is chosen, a size and type check with the reason in words, progress
 * while it uploads, and remove. Accepts images only.
 */
export function AvatarUpload({ value, onFile, onRemove, initials, maxSizeMb = 5, className }: AvatarUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function choose(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > maxSizeMb * 1e6) return setError(`That file is larger than ${maxSizeMb} MB.`);
    setError(null);
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      await onFile(file);
    } catch {
      setError("The upload did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const shown = preview ?? value;
  return (
    <div data-slot="avatar-upload" className={cn("flex items-center gap-5", className)}>
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted">
        {shown ? <img src={shown} alt="Your profile picture" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-xl font-medium text-muted-foreground">{initials}</span>}
        {busy ? <span role="status" className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs">Uploading…</span> : null}
      </div>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <input ref={input} id={id} type="file" accept="image/*" className="sr-only" onChange={(event) => { void choose(event.target.files?.[0]); event.target.value = ""; }} />
          <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={busy}><IconCamera /> {shown ? "Change picture" : "Upload picture"}</Button>
          {shown && onRemove ? <Button size="sm" variant="ghost" onClick={() => { setPreview(null); onRemove(); }} disabled={busy}><IconTrash /> Remove</Button> : null}
        </div>
        <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>{error ?? `JPG, PNG or WebP, up to ${maxSizeMb} MB.`}</p>
      </div>
    </div>
  );
}
