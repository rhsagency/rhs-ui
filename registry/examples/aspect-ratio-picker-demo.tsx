"use client";

import { useState, type ReactNode } from "react";

import { IconImage } from "@rhs-ui/icons";
import { AspectRatioPicker, type AspectRatio } from "@rhs-ui/primitives/aspect-ratio-picker";
import { Button } from "@rhs-ui/primitives/button";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The crop, drawn: a box of the ratio, as large as the space allows. */
function Crop({ ratio }: { ratio: AspectRatio }): React.JSX.Element {
  return (
    <div className="grid h-36 place-items-center rounded-lg bg-muted/50">
      <div
        className="grid max-h-28 max-w-[min(100%,15rem)] place-items-center rounded-md border border-border bg-card text-muted-foreground shadow-xs"
        style={{ aspectRatio: `${ratio.width} / ${ratio.height}`, height: ratio.height > ratio.width ? "7rem" : undefined, width: ratio.height > ratio.width ? undefined : "100%" }}
      >
        <IconImage aria-hidden="true" className="size-5" />
      </div>
    </div>
  );
}

function Post(): React.JSX.Element {
  const [ratio, setRatio] = useState<AspectRatio>({ width: 16, height: 9 });
  const [saved, setSaved] = useState(false);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(true);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Crop the launch photo</h2>
        <p className="text-xs text-muted-foreground">Choose the shape the post is cropped to. Turn the shapes on their side with the switch.</p>
      </div>
      <AspectRatioPicker
        name="crop"
        orientationToggle
        label="Crop shape"
        value={ratio}
        onValueChange={(next) => {
          setRatio(next);
          setSaved(false);
        }}
      />
      <Crop ratio={ratio} />
      <Button type="submit">Apply crop</Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {saved ? (
          <span>Cropped to {ratio.width}:{ratio.height}.</span>
        ) : (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{`{ width: ${ratio.width}, height: ${ratio.height} }`}</code>
          </>
        )}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: arrow keys move and choose, Custom takes any size and reduces it">
        <Post />
      </Example>
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A ratio that is not on offer opens Custom: here 2:1, a banner">
          <AspectRatioPicker defaultValue={{ width: 2, height: 1 }} label="Banner shape" />
        </Example>
        <Example caption="Only the shapes an ad network takes, and no Custom">
          <AspectRatioPicker ratios={[{ width: 1, height: 1 }, { width: 4, height: 5 }, { width: 9, height: 16 }]} defaultValue={{ width: 4, height: 5 }} allowCustom={false} label="Ad format" />
        </Example>
        <Example caption="Disabled">
          <AspectRatioPicker disabled defaultValue={{ width: 4, height: 3 }} label="Locked shape" />
        </Example>
      </div>
    </div>
  );
}
