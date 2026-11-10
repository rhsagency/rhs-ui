"use client";

import { useState } from "react";

import { IconDownload } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

export interface QrActionsProps {
  /** The code as a whole SVG document, which is the file for Download SVG. Give it a width and height so other tools import it at a usable size. */
  svg: string;
  /** The width of the code in modules, quiet zone included. The PNG gets a whole number of pixels for each. */
  modules: number;
  /** At least this many pixels wide, for the PNG. */
  pngSize: number;
  /** The name of the files, without the extension. */
  filename: string;
  /** Called with the format and the file after a download has started. */
  onDownload?: (format: "svg" | "png", file: Blob) => void;
  /** The words of the buttons and of the message a screen reader hears. {file} stands for the file name. */
  labels: { actions: string; downloadSvg: string; downloadPng: string; downloaded: string; failed: string };
}

/** Hand a file to the browser's download, from a blob that lives for a moment. */
function save(file: Blob, name: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The same SVG at `side` pixels: the width and height of its root element are set, or replaced when it already has them. */
function sized(svg: string, side: number): string {
  return svg.replace(/^<svg\b[^>]*>/, (tag) => tag.replace(/\s(?:width|height)="[^"]*"/g, "").replace("<svg", `<svg width="${side}" height="${side}"`));
}

/** Draw the SVG onto a canvas, only now, and read the PNG back. The modules land on whole pixels, so the edges stay sharp. */
function rasterise(svg: string, side: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([sized(svg, side)], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = side;
      canvas.height = side;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("No canvas."));
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, side, side);
      canvas.toBlob((file) => (file ? resolve(file) : reject(new Error("No PNG."))), "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The SVG did not load."));
    };
    image.src = url;
  });
}

/** The two download buttons under a QR code. The only part of it that needs a script. */
export function QrActions({ svg, modules, pngSize, filename, onDownload, labels }: QrActionsProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function downloadSvg() {
    const file = new Blob([svg], { type: "image/svg+xml" });
    save(file, `${filename}.svg`);
    setMessage(labels.downloaded.replace("{file}", `${filename}.svg`));
    onDownload?.("svg", file);
  }

  async function downloadPng() {
    setBusy(true);
    try {
      const file = await rasterise(svg, Math.ceil(pngSize / modules) * modules);
      save(file, `${filename}.png`);
      setMessage(labels.downloaded.replace("{file}", `${filename}.png`));
      onDownload?.("png", file);
    } catch {
      setMessage(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-slot="qr-code-actions" role="group" aria-label={labels.actions} className="flex flex-wrap items-center justify-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={downloadSvg}>
        <IconDownload />
        {labels.downloadSvg}
      </Button>
      <Button type="button" variant="outline" size="sm" loading={busy} onClick={downloadPng}>
        {busy ? null : <IconDownload />}
        {labels.downloadPng}
      </Button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </div>
  );
}
