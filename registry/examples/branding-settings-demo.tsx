"use client";

import { useState } from "react";

import { BrandingSettings, type BrandingValue } from "@rhs-ui/application/branding-settings";

// Wordmarks and an icon drawn as SVG, so the preview needs no files.
const svg = (width: number, height: number, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`)}`;

const wordmark = (ink: string) =>
  svg(
    150,
    28,
    `<path d="M3 24V4l15 20V4" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><text x="30" y="21.5" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="-0.6" fill="${ink}">Northwind</text>`,
  );

const ICON = svg(128, 128, `<rect width="128" height="128" rx="28" fill="#111111"/><path d="M40 92V36l48 56V36" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`);

const INITIAL: BrandingValue = { logoLight: wordmark("#111111"), logoDark: wordmark("#fafafa"), icon: ICON, color: "#1d4ed8" };

// The last swatch is too light to stand out on a white page: pick it to see how a refusal reads.
const SWATCHES = ["#111111", "#1d4ed8", "#0e7490", "#0f766e", "#15803d", "#ea580c", "#b91c1c", "#be185d", "#475569", "#facc15"];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState(INITIAL);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-xs text-muted-foreground">Choose a logo file to see the previews follow. The pale yellow swatch is too light for a white page, so it is refused with the reason.</p>
      <BrandingSettings
        value={value}
        name="Northwind"
        colors={SWATCHES}
        // A real app would send the file to storage and resolve to its address; here the browser keeps it.
        onUpload={async (_kind, file) => {
          await wait(900);
          return URL.createObjectURL(file);
        }}
        onSave={async (next) => {
          await wait(800);
          setValue(next);
        }}
      />
    </div>
  );
}
