"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ImageCropper, type ImageCrop } from "@rhs-ui/application/image-cropper";
import { cropToBlob } from "@rhs-ui/application/image-cropper/crop";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";

/** A picture drawn as a data URI, so the demo needs no files and no network: a cabin on a lake, on the left of a wide shot. */
const LAKE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6cddb"/><stop offset=".72" stop-color="#f3e6d2"/><stop offset="1" stop-color="#f6e7c9"/></linearGradient><linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93b4bd"/><stop offset="1" stop-color="#3b6471"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#sky)"/><circle cx="1180" cy="250" r="110" fill="#f7e3b4"/><path d="M0 560 L220 380 L420 520 L680 300 L960 540 L1180 420 L1420 560 L1600 480 L1600 650 L0 650Z" fill="#9aaebb"/><path d="M0 650 L180 530 L380 620 L600 510 L860 640 L1100 570 L1340 650 L1600 600 L1600 710 L0 710Z" fill="#6f8b8f"/><rect y="650" width="1600" height="350" fill="url(#lake)"/><g fill="#fff" opacity=".22"><rect x="700" y="740" width="360" height="5"/><rect x="900" y="800" width="420" height="5"/><rect x="1100" y="870" width="360" height="5"/><rect x="760" y="920" width="300" height="5"/></g><path d="M0 800 Q260 730 560 770 T1120 790 T1600 770 L1600 1000 L0 1000Z" fill="#35553f"/><g transform="translate(430 650)"><rect x="0" y="40" width="210" height="130" fill="#c78d5d"/><path d="M-24 44 L105 -44 L234 44Z" fill="#6c3e2a"/><rect x="150" y="-30" width="26" height="52" fill="#5b3524"/><rect x="88" y="86" width="40" height="84" fill="#5b3524"/><rect x="26" y="78" width="38" height="38" fill="#f3e3b3"/><rect x="146" y="78" width="38" height="38" fill="#f3e3b3"/></g><g fill="#27483a"><path d="M740 790 L790 680 L840 790Z"/><path d="M730 830 L790 720 L850 830Z"/><path d="M1180 800 L1235 690 L1290 800Z"/><path d="M1160 840 L1235 730 L1310 840Z"/><path d="M150 800 L205 690 L260 800Z"/><path d="M130 850 L205 740 L280 850Z"/></g></svg>`,
  );

/** A file that is not a picture, to show the calm error. */
const NOT_AN_IMAGE = "data:text/plain;charset=utf-8,this%20is%20not%20a%20picture";

const CHOICES = [
  { value: "square", label: "1:1" },
  { value: "landscape", label: "4:3" },
  { value: "wide", label: "16:9" },
  { value: "free", label: "Free" },
  { value: "round", label: "Round" },
];

/** What each choice asks of the cropper. */
const SHAPES: Record<string, { aspect: number | "free"; shape: "rect" | "round" }> = {
  square: { aspect: 1, shape: "rect" },
  landscape: { aspect: 4 / 3, shape: "rect" },
  wide: { aspect: 16 / 9, shape: "rect" },
  free: { aspect: "free", shape: "rect" },
  round: { aspect: 1, shape: "round" },
};

/** A caption above a case, in the quiet voice the rest of the demo uses. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const WIDTH = 400;

export default function Demo(): React.JSX.Element {
  const [choice, setChoice] = useState("square");
  const [crop, setCrop] = useState<ImageCrop | null>(null);
  const [picture, setPicture] = useState<HTMLImageElement | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const shown = useRef<string | null>(null);
  const { aspect, shape } = SHAPES[choice] ?? SHAPES.square!;

  // The cut is made in the browser with cropToBlob, a moment after the crop stops moving.
  useEffect(() => {
    if (!picture || !crop) return;
    let stale = false;
    const timer = window.setTimeout(() => {
      cropToBlob(picture, crop, { maxWidth: WIDTH, shape }).then(
        (blob) => {
          if (stale) return;
          const url = URL.createObjectURL(blob);
          const old = shown.current;
          shown.current = url;
          setResult(url);
          if (old) window.setTimeout(() => URL.revokeObjectURL(old), 1000);
        },
        () => undefined,
      );
    }, 120);
    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [picture, crop, shape]);

  useEffect(
    () => () => {
      if (shown.current) URL.revokeObjectURL(shown.current);
    },
    [],
  );

  const scale = crop ? Math.min(1, WIDTH / crop.width) : 1;

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-4xl gap-10">
        <Case caption="Drag the picture under the frame, zoom with the slider, the plus and minus keys, a pinch or Ctrl and the wheel. What is outside the frame is dimmed. Pick a shape: Free lets you drag the frame's edges, Round is for avatars.">
          <div className="grid gap-5">
            <SegmentedControl label="Shape of the crop" options={CHOICES} value={choice} onValueChange={setChoice} className="justify-self-start" />
            <div className="grid gap-6 @3xl:grid-cols-[minmax(0,1fr)_17rem] @3xl:items-start">
              <ImageCropper src={LAKE} alt="A wooden cabin with a red roof on the shore of a lake, hills and a low sun behind it" value={crop} onValueChange={setCrop} onReady={setPicture} aspect={aspect} shape={shape} />
              <aside className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
                <p className="text-sm font-medium tracking-[-0.01em]">Result</p>
                <div className="grid min-h-44 place-items-center rounded-lg bg-muted/60 p-4">
                  {result ? <img src={result} alt="The cropped picture, as it will be saved" className="max-h-44 max-w-full rounded-[2px] shadow-xs" /> : <p className="text-xs text-muted-foreground">Move the crop to see the cut.</p>}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">{crop ? `${Math.round(crop.width * scale)} × ${Math.round(crop.height * scale)} px, cut in the browser` : " "}</p>
                <p className="rounded-md bg-muted/60 px-2.5 py-2 font-mono text-[0.6875rem] leading-5 text-muted-foreground">{crop ? JSON.stringify(crop).replace(/,/g, ", ") : "{}"}</p>
              </aside>
            </div>
          </div>
        </Case>

        <Case caption="A picture that cannot be loaded gets a calm error with the reason, and a way to try again.">
          <div className="max-w-md">
            <ImageCropper src={NOT_AN_IMAGE} alt="" />
          </div>
        </Case>
      </div>
    </div>
  );
}
