"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ImagePicker, type ImagePickerImage } from "@rhs-ui/primitives/image-picker";

/** Pictures drawn as SVG, so the demo needs no files: quiet landscapes in warm greys, 16:10. */
const svg = (inner: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice">${inner}</svg>`)}`;

const ART: Record<string, string> = {
  dune: svg(
    '<rect width="640" height="400" fill="#eceae6"/><circle cx="380" cy="118" r="46" fill="#fbfaf8"/><path d="M0 246C92 198 182 208 272 244S452 290 640 212V400H0Z" fill="#d3d0ca"/><path d="M0 292C112 246 212 264 322 300S522 332 640 270V400H0Z" fill="#b4b0a9"/><path d="M0 336C122 302 242 322 342 346S542 372 640 326V400H0Z" fill="#8d8983"/><path d="M0 374C142 352 262 366 382 381S562 396 640 368V400H0Z" fill="#605d59"/>',
  ),
  harbour: svg(
    '<rect width="640" height="400" fill="#dfe1e4"/><rect y="204" width="640" height="196" fill="#c2c6cc"/><rect x="92" y="118" width="10" height="86" fill="#585d65"/><rect x="156" y="150" width="52" height="54" fill="#757a83"/><rect x="214" y="132" width="36" height="72" fill="#4a4f57"/><rect x="258" y="164" width="64" height="40" fill="#8a8f98"/><g stroke="#a3a8af" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M96 222v60M180 222v46M232 222v62M290 222v36"/></g><g stroke="#d8dbe0" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M40 252h110M200 276h150M380 244h210M60 316h260M420 300h170M120 352h300"/></g>',
  ),
  contour: svg(
    '<rect width="640" height="400" fill="#efeeeb"/><g fill="none" stroke="#8d8a85" stroke-width="1.6" opacity=".7"><ellipse cx="344" cy="204" rx="318" ry="178"/><ellipse cx="344" cy="204" rx="268" ry="148"/><ellipse cx="338" cy="206" rx="218" ry="118"/><ellipse cx="334" cy="208" rx="168" ry="90"/><ellipse cx="332" cy="210" rx="120" ry="64"/><ellipse cx="330" cy="212" rx="74" ry="38"/><ellipse cx="330" cy="212" rx="32" ry="16" fill="#cfcdc8"/></g>',
  ),
  grid: svg(
    '<rect width="640" height="400" fill="#202124"/><rect width="640" height="168" fill="#2b2d31"/><circle cx="320" cy="168" r="64" fill="#3a3c41"/><rect y="168" width="640" height="232" fill="#202124"/><g stroke="#8a8d94" stroke-width="1.2" opacity=".55"><path d="M320 168L-40 400M320 168L40 400M320 168L160 400M320 168L240 400M320 168L320 400M320 168L400 400M320 168L480 400M320 168L600 400M320 168L680 400"/><path d="M0 188H640M0 212H640M0 244H640M0 288H640M0 348H640"/></g>',
  ),
  dusk: svg(
    '<rect width="640" height="400" fill="#17181a"/><circle cx="320" cy="196" r="92" fill="#e9e7e3"/><g fill="#17181a"><rect y="200" width="640" height="7"/><rect y="226" width="640" height="9"/><rect y="254" width="640" height="11"/><rect y="284" width="640" height="14"/></g><rect y="330" width="640" height="70" fill="#17181a"/><path d="M0 330H640" stroke="#3b3d41" stroke-width="2"/>',
  ),
  arch: svg(
    '<rect width="640" height="400" fill="#e8e6e1"/><g fill="none" stroke-width="3"><path d="M110 400V210a90 90 0 0 1 180 0V400" stroke="#a9a59e"/><path d="M140 400V214a60 60 0 0 1 120 0V400" stroke="#8d8982"/><path d="M170 400V218a30 30 0 0 1 60 0V400" stroke="#6e6a65"/><path d="M350 400V210a90 90 0 0 1 180 0V400" stroke="#a9a59e"/><path d="M380 400V214a60 60 0 0 1 120 0V400" stroke="#8d8982"/><path d="M410 400V218a30 30 0 0 1 60 0V400" stroke="#6e6a65"/></g>',
  ),
  ripple: svg(
    '<rect width="640" height="400" fill="#ecebe8"/><g fill="none" stroke="#8d8a85" stroke-width="1.6" opacity=".75"><circle cx="150" cy="320" r="40"/><circle cx="150" cy="320" r="86"/><circle cx="150" cy="320" r="134"/><circle cx="150" cy="320" r="184"/><circle cx="150" cy="320" r="236"/><circle cx="150" cy="320" r="290"/><circle cx="150" cy="320" r="346"/><circle cx="150" cy="320" r="404"/></g><circle cx="150" cy="320" r="14" fill="#5f5c58"/>',
  ),
  slate: svg(
    '<defs><pattern id="s" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><rect width="13" height="26" fill="#cfcdc8"/><rect x="13" width="13" height="26" fill="#d9d7d2"/></pattern></defs><rect width="640" height="400" fill="url(#s)"/><rect x="188" y="110" width="264" height="180" rx="14" fill="#f4f3f0"/><rect x="220" y="150" width="120" height="12" rx="6" fill="#bdbab4"/><rect x="220" y="178" width="196" height="10" rx="5" fill="#d3d0ca"/><rect x="220" y="200" width="168" height="10" rx="5" fill="#d3d0ca"/>',
  ),
};

const COVERS: ImagePickerImage[] = [
  { id: "dune", src: ART.dune ?? "", alt: "Layered sand dunes under a pale sun", label: "Dune" },
  { id: "harbour", src: ART.harbour ?? "", alt: "A quiet harbour with masts reflected in the water", label: "Harbour" },
  { id: "contour", src: ART.contour ?? "", alt: "Contour lines of a hill, drawn as fine rings", label: "Contour" },
  { id: "grid", src: ART.grid ?? "", alt: "A dark perspective grid running to the horizon", label: "Grid" },
  { id: "dusk", src: ART.dusk ?? "", alt: "A pale sun sinking behind horizontal bars", label: "Dusk" },
];

const GALLERY: ImagePickerImage[] = [
  { id: "ripple", src: ART.ripple ?? "", alt: "Rings spreading from a point in the lower left", label: "Ripple" },
  { id: "slate", src: ART.slate ?? "", alt: "A white card on a diagonal striped slate", label: "Slate" },
  { id: "dune", src: ART.dune ?? "", alt: "Layered sand dunes under a pale sun", label: "Dune" },
  { id: "harbour", src: ART.harbour ?? "", alt: "A quiet harbour with masts reflected in the water", label: "Harbour" },
  { id: "contour", src: ART.contour ?? "", alt: "Contour lines of a hill, drawn as fine rings", label: "Contour" },
  { id: "arch", src: ART.arch ?? "", alt: "Two sets of nested arches in warm grey", label: "Arch" },
];

// One of these cannot be shown (it is not a picture), so its tile shows what it would have been.
const WITH_A_MISSING_FILE: ImagePickerImage[] = [
  { id: "dune", src: ART.dune ?? "", alt: "Layered sand dunes under a pale sun", label: "Dune" },
  { id: "lost", src: "data:image/png;base64,AAAA", alt: "The spring campaign photo", label: "Spring campaign" },
  { id: "arch", src: ART.arch ?? "", alt: "Two sets of nested arches in warm grey", label: "Arch" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Cover(): React.JSX.Element {
  const [cover, setCover] = useState<string | null>("dune");
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(cover ?? "no cover");
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Choose a cover for the Halcyon report</h2>
        <p className="text-xs text-muted-foreground">Move with the arrow keys, choose with Space or Enter. Up and Down go a whole row.</p>
      </div>
      <ImagePicker
        aria-label="Cover"
        name="cover"
        images={COVERS}
        allowNone
        value={cover}
        onValueChange={(next) => {
          setCover(next);
          setSaved(null);
        }}
      />
      <Button type="submit">Save cover</Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {saved ? (
          <span>Saved: {saved}</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(cover)}</code>
          </>
        )}
      </p>
    </form>
  );
}

function Gallery(): React.JSX.Element {
  const [ids, setIds] = useState<string[]>(["ripple", "contour"]);
  return (
    <div className="grid gap-3">
      <ImagePicker aria-label="Gallery photos" multiple max={3} columns={4} aspect={1} images={GALLERY} value={ids} onValueChange={setIds} />
      <p className="text-xs text-muted-foreground tabular-nums">
        Reported <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(ids)}</code>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: the first tile clears the choice, and what is stored is the id">
          <Cover />
        </Example>
        <Example caption="A file that is missing shows its label instead of a broken picture">
          <ImagePicker aria-label="Campaign cover" images={WITH_A_MISSING_FILE} defaultValue="dune" />
        </Example>
        <Example caption="Nothing to choose from is said in words">
          <ImagePicker aria-label="Header image" images={[]} emptyText="No header images have been uploaded yet." />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Several, up to three: the others dim, and the count says why">
          <Gallery />
        </Example>
        <Example caption="Loading: tiles in the shape of the pictures, shaded">
          <ImagePicker aria-label="Cover" images={[]} loading />
        </Example>
        <Example caption="Disabled">
          <ImagePicker aria-label="Cover" images={COVERS.slice(0, 3)} defaultValue="harbour" disabled />
        </Example>
      </div>
    </div>
  );
}
