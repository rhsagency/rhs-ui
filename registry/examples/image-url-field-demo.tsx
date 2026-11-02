"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ImageUrlField, type ImageUrlFieldProps, type ImageUrlState } from "@rhs-ui/primitives/image-url-field";
import { Label } from "@rhs-ui/primitives/label";

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A picture drawn in SVG and written as a data address, so the preview needs no network. */
const picture = (width: number, height: number, drawing: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${drawing}</svg>`)}`;

const KETTLE = picture(
  1200,
  800,
  '<rect width="1200" height="800" fill="#e9e4dc"/><circle cx="600" cy="400" r="290" fill="#f6f1e8"/><path d="M455 330h290l36 250a44 44 0 0 1-44 50H463a44 44 0 0 1-44-50z" fill="#1c1c1c"/><path d="M515 330l24-76h122l24 76z" fill="#2e2e2e"/><rect x="578" y="206" width="44" height="52" rx="22" fill="#2e2e2e"/><path d="M768 384c78 0 78 160 0 160" fill="none" stroke="#1c1c1c" stroke-width="34" stroke-linecap="round"/><path d="M440 372l-86-60" fill="none" stroke="#1c1c1c" stroke-width="30" stroke-linecap="round"/><rect x="370" y="650" width="460" height="22" rx="11" fill="#bdb6aa"/>',
);

const MUG = picture(
  640,
  480,
  '<rect width="640" height="480" fill="#dfe3e6"/><circle cx="320" cy="240" r="170" fill="#eef0f2"/><rect x="215" y="140" width="210" height="190" rx="30" fill="#fcfcfc"/><path d="M425 182c66 0 66 104 0 104" fill="none" stroke="#fcfcfc" stroke-width="26" stroke-linecap="round"/><rect x="215" y="140" width="210" height="46" rx="23" fill="#c7c7c7"/><rect x="170" y="340" width="300" height="16" rx="8" fill="#a8b0b5"/>',
);

/** A host under .example never resolves (RFC 2606), so this address fails the same way everywhere, offline included. */
const BROKEN = "https://images.northwind.example/products/kestrel-kettle.jpg";

function Field({ label, ...props }: Omit<ImageUrlFieldProps, "id"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <ImageUrlField id={id} {...props} />
    </div>
  );
}

function ProductPhoto(): React.JSX.Element {
  const id = useId();
  const [url, setUrl] = useState(KETTLE);
  const [state, setState] = useState<ImageUrlState>({ status: "loading", width: null, height: null });
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">Kestrel kettle, main photo</h2>
        <p className="text-xs text-muted-foreground">Paste an address and the picture shows up beside it. Nothing is uploaded. These pictures are drawn in the demo, so their addresses start with data:</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Image address</Label>
        <ImageUrlField
          id={id}
          name="photo"
          allowData
          requireHttps
          value={url}
          onValueChange={(next, now) => {
            setUrl(next);
            setState(now);
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Try</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setUrl(KETTLE)}>
          Kettle
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setUrl(MUG)}>
          Mug
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setUrl(BROKEN)}>
          Dead link
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setUrl("http://images.northwind.example/kettle.jpg")}>
          http://
        </Button>
      </div>
      {/* What the field reported is for the reader of the demo, so a screen reader is not read it on every key. */}
      <p aria-hidden="true" className="grid gap-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>onValueChange, the state</span>
        <code className="font-mono text-[0.6875rem] break-all text-foreground">{JSON.stringify(state)}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      {/* Two columns of about the same height, so the sheet has no empty corner. */}
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: paste or type an address, or use the buttons. A pasted address loads at once, typing waits for a pause">
          <ProductPhoto />
        </Example>
        <Example caption="Loaded: the picture sits in the field, and its own size is said in words">
          <Field label="Cover photo" defaultValue={MUG} allowData />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="An address that does not load as an image says so in words">
          <Field label="Banner" defaultValue={BROKEN} />
        </Example>
        <Example caption="http:// is turned down before any request is made when requireHttps is on. A data: address is turned down the same way unless allowData is on">
          <Field label="Logo" defaultValue="http://images.northwind.example/logo.png" requireHttps />
        </Example>
        <Example caption="Empty, and disabled">
          <div className="grid gap-4">
            <Field label="Gallery image" />
            <Field label="Locked image" defaultValue={KETTLE} allowData disabled />
          </div>
        </Example>
      </div>
    </div>
  );
}
