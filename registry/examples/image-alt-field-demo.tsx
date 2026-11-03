"use client";

import { useState, type ReactNode } from "react";

import { ImageAltField, type ImageAltValue } from "@rhs-ui/application/image-alt-field";
import { Button } from "@rhs-ui/primitives/button";

/** A picture drawn as a data URI, so the demo needs no files and no network: the lamp on a product page. */
function lampPicture(background: string, floor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"><rect width="400" height="250" fill="${background}"/><rect y="196" width="400" height="54" fill="${floor}"/><g transform="translate(200 214)"><ellipse cx="0" cy="2" rx="54" ry="6" fill="#000" opacity="0.12"/><path d="M-40 0 Q-40 -40 0 -40 Q40 -40 40 0 Z" fill="#b9985a"/><rect x="-3.5" y="-128" width="7" height="92" fill="#a4854c"/><path d="M-46 -120 L-24 -196 L24 -196 L46 -120 Z" fill="#f4eee1"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const LAMP = lampPicture("#ece7de", "#d9d2c4");
const LAMP_DARK = lampPicture("#d8d3c6", "#c4bca9");

const GOOD = "Brass desk lamp with a pleated linen shade, on an oak desk";

/** A caption and what it captions. Under a container wide enough for two columns the captions share their rows, so the cards start level. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3 @3xl:row-span-2 @3xl:grid-rows-subgrid">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** What the field reported last, as the code that receives it would see it. */
function Report({ value }: { value: ImageAltValue }): React.JSX.Element {
  return (
    <p className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-[0.6875rem] leading-5 text-muted-foreground [overflow-wrap:anywhere]">
      {`{ file: ${value.file ? value.file.name : "null"}, alt: ${JSON.stringify(value.alt)}, decorative: ${value.decorative} }`}
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [typed, setTyped] = useState<ImageAltValue>({ file: null, alt: GOOD, decorative: false });
  const [missing, setMissing] = useState<ImageAltValue>({ file: null, alt: "", decorative: false });
  const [fresh, setFresh] = useState<ImageAltValue>({ file: null, alt: "", decorative: false });
  const [checked, setChecked] = useState(false);

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-4xl gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Case caption="A saved image with its description. Edit the text and the advice under the box follows it: try starting with image of, a file name or a single word. Tick decorative, then untick it: the text comes back.">
          <div className="grid gap-3">
            <ImageAltField src={LAMP} value={typed} onValueChange={setTyped} maxLength={125} required />
            <Report value={typed} />
          </div>
        </Case>

        <Case caption="After a failed submit the form sets invalid. A description that is empty, and not marked decorative, is the error.">
          <div className="grid gap-3">
            <ImageAltField src={LAMP_DARK} value={missing} onValueChange={setMissing} invalid required />
            <Report value={missing} />
          </div>
        </Case>

        <Case caption="No image yet. Choose one, or drop one on the card: it is previewed from the file itself, and a file of the wrong type or over 5 MB is turned away with the reason.">
          <div className="grid gap-3">
            <ImageAltField value={fresh} onValueChange={setFresh} accept="image/png,image/jpeg,image/webp" maxSize={5_000_000} invalid={checked} required />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Button variant="outline" size="sm" onClick={() => setChecked((current) => !current)}>
                {checked ? "Clear the check" : "Check the form"}
              </Button>
              <Report value={fresh} />
            </div>
          </div>
        </Case>

        <Case caption="Marked decorative: the box is empty and off, so the image tells a screen reader nothing.">
          <ImageAltField src={LAMP} defaultValue={{ alt: "", decorative: true }} />
        </Case>
      </div>
    </div>
  );
}
