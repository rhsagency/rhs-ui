"use client";

import { useRef, useState, type ReactNode } from "react";

import { ImageUploadGrid, type UploadGridImage } from "@rhs-ui/application/image-upload-grid";
import { Button } from "@rhs-ui/primitives/button";

/** Draws a picture as a data URI, so the demo needs no files and no network. Each one is a flat scene for a product page. */
function picture(inner: string, background: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${background}"/>${inner}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** The lamp: a brass base, a stem and a linen shade, at a given position and size. */
function lamp(x: number, y: number, scale: number): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="2" rx="62" ry="7" fill="#000" opacity="0.12"/>
    <path d="M-46 0 Q-46 -46 0 -46 Q46 -46 46 0 Z" fill="#b9985a"/>
    <path d="M-30 -8 Q-30 -34 -6 -40" fill="none" stroke="#d6bb82" stroke-width="5" stroke-linecap="round"/>
    <rect x="-4" y="-150" width="8" height="106" fill="#a4854c"/>
    <path d="M-52 -140 L-28 -226 L28 -226 L52 -140 Z" fill="#f4eee1"/>
    <path d="M-28 -226 L28 -226 L26 -216 L-26 -216 Z" fill="#e6dcc6"/>
  </g>`;
}

const SAMPLES: readonly UploadGridImage[] = [
  {
    id: "front",
    alt: "Brass desk lamp, front view",
    src: picture(`<rect y="300" width="400" height="100" fill="#d9d2c4"/>${lamp(200, 318, 1.15)}`, "#ece7de"),
  },
  {
    id: "side",
    alt: "Brass desk lamp, side view",
    src: picture(`<rect x="250" y="60" width="110" height="170" rx="4" fill="#f8f5ef"/><rect y="300" width="400" height="100" fill="#cfc7b6"/>${lamp(150, 318, 1.15)}`, "#e3ddd0"),
  },
  {
    id: "shade",
    alt: "Close-up of the pleated linen shade",
    src: picture(
      `<path d="M30 40 L370 40 L330 360 L70 360 Z" fill="#f2ebdb"/>${Array.from({ length: 15 }, (_, index) => `<line x1="${30 + index * 24.3}" y1="40" x2="${70 + index * 18.7}" y2="360" stroke="#d9cfb7" stroke-width="3"/>`).join("")}`,
      "#cfc6b3",
    ),
  },
  {
    id: "desk",
    alt: "The lamp on an oak desk beside a laptop",
    src: picture(
      `<rect y="268" width="400" height="132" fill="#a98b63"/><rect y="262" width="400" height="8" fill="#8f7450"/><rect x="40" y="206" width="140" height="62" rx="4" fill="#3b3b3b"/><rect x="26" y="262" width="168" height="8" rx="4" fill="#5a5a5a"/>${lamp(300, 284, 0.95)}<rect x="212" y="236" width="26" height="30" rx="4" fill="#f4f1ea"/>`,
      "#e6e1d6",
    ),
  },
  {
    id: "switch",
    alt: "Close-up of the brass switch and cord",
    src: picture(`<circle cx="200" cy="190" r="104" fill="#b9985a"/><circle cx="200" cy="190" r="78" fill="#a4854c"/><rect x="190" y="130" width="20" height="82" rx="10" fill="#e9d9b3"/><path d="M200 294 C 200 340 150 350 120 400" fill="none" stroke="#d8d3c8" stroke-width="9" stroke-linecap="round"/>`, "#262626"),
  },
  {
    id: "box",
    alt: "The lamp in its kraft box",
    src: picture(`<rect x="50" y="110" width="300" height="200" rx="6" fill="#c8ab7d"/><rect x="50" y="110" width="300" height="46" rx="6" fill="#b89968"/><rect x="150" y="196" width="100" height="56" fill="#f4eee1"/><text x="200" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="17" letter-spacing="3" fill="#3b3b3b">HALCYON</text>`, "#e8e0d2"),
  },
];

const byId = (id: string): UploadGridImage => SAMPLES.find((sample) => sample.id === id) ?? SAMPLES[0]!;

/** The name of a file without its extension, to describe a picture the person just added. */
const describe = (file: File) => file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [product, setProduct] = useState<UploadGridImage[]>(["front", "side", "shade", "desk", "switch"].map(byId));
  const [fresh, setFresh] = useState<UploadGridImage[]>([]);
  const [small, setSmall] = useState<UploadGridImage[]>(["front", "desk", "switch", "box"].map(byId));
  const added = useRef(0);

  /** What a real app does with a chosen file: a preview now, an upload in the background. Here it is only the preview. */
  function fromFiles(files: File[]): UploadGridImage[] {
    return files.map((file) => ({ id: `new-${(added.current += 1)}`, src: URL.createObjectURL(file), alt: describe(file) }));
  }

  /** For someone without a picture to hand: the sixth sample, the first time, and a copy of it after that. */
  function addSample() {
    const sample = byId("box");
    const copy = added.current;
    added.current += 1;
    setProduct((current) => [...current, { ...sample, id: copy === 0 ? sample.id : `${sample.id}-${copy}` }]);
  }

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-4xl gap-10">
        <Case caption="Five of up to eight. Hover or focus a tile for its buttons, or drag one onto another to reorder. Drop pictures on the grid, or choose some: they arrive through onFilesAdded, and PNG, JPG and WebP up to 5 MB are let through.">
          <div className="grid gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-[-0.01em]">Halcyon desk lamp</h2>
                <p className="text-xs text-muted-foreground">Photos on the product page</p>
              </div>
              <Button variant="outline" size="sm" onClick={addSample} disabled={product.length >= 8}>
                Add a sample photo
              </Button>
            </div>
            <ImageUploadGrid
              label="Product photos"
              images={product}
              onImagesChange={setProduct}
              onFilesAdded={(files) => setProduct((current) => [...current, ...fromFiles(files)])}
              max={8}
              accept="image/png,image/jpeg,image/webp"
              maxSize={5_000_000}
            />
          </div>
        </Case>

        <div className="grid gap-x-8 gap-y-10 @2xl:grid-cols-2">
          <Case caption="Nothing yet: one wide tile with a hint. The first picture added becomes the main one.">
            <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
              <ImageUploadGrid label="New photos" images={fresh} onImagesChange={setFresh} onFilesAdded={(files) => setFresh((current) => [...current, ...fromFiles(files)])} />
            </div>
          </Case>

          <Case caption="A full set of four. The add tile is off and says why. Remove a picture and it comes back.">
            <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
              <ImageUploadGrid label="Gallery photos" images={small} onImagesChange={setSmall} onFilesAdded={(files) => setSmall((current) => [...current, ...fromFiles(files)])} max={4} />
            </div>
          </Case>
        </div>
      </div>
    </div>
  );
}
