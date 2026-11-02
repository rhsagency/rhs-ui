"use client";

import { useEffect, useRef, useState } from "react";

export interface BookCoverProps {
  /** The picture, as an image address. */
  src: string;
  /** What it shows. Leave it out for a cover that only decorates. */
  alt?: string;
}

/**
 * The picture of a book's cover, laid over the typographic jacket. When it does
 * not load it takes itself away, so the jacket shows in place of the browser's
 * broken-picture icon. It is a client component for that one reason: the rest
 * of the card stays on the server.
 */
export function BookCover({ src, alt }: BookCoverProps) {
  // The address of the picture that did not load: a new address gets its own try.
  const [failed, setFailed] = useState<string | null>(null);
  const cover = useRef<HTMLImageElement>(null);

  // A picture that failed before the page was interactive left no error for React to hear, and the browser does not say it twice. One that
  // looks lost (finished, with no width) is asked for once more: that answer is heard.
  useEffect(() => {
    const img = cover.current;
    if (!img || !img.complete || img.naturalWidth > 0 || !img.currentSrc) return;
    const probe = new Image();
    probe.onerror = () => setFailed(src);
    probe.src = img.currentSrc;
  }, [src]);

  if (failed === src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- framework-neutral: a plain picture, which any optimiser can replace
    <img ref={cover} data-slot="book-cover" src={src} alt={alt ?? ""} loading="lazy" decoding="async" onError={() => setFailed(src)} className="absolute inset-0 size-full object-cover" />
  );
}
