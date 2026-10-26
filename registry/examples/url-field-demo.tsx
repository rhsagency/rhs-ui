"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { UrlField, type UrlFieldProps } from "@rhs-ui/primitives/url-field";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A field that has been left once already, so the preview shows what it says afterwards. */
function Left({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Only when nothing has focus: a preview must never take it from a page the reader is already using.
    if (document.activeElement && document.activeElement !== document.body) return;
    const input = box.current?.querySelector("input");
    input?.focus({ preventScroll: true });
    input?.blur();
  }, []);
  return <div ref={box}>{children}</div>;
}

function Field({ leave, ...props }: Omit<UrlFieldProps, "id"> & { leave?: boolean }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      <Label htmlFor={id}>Website</Label>
      <UrlField id={id} placeholder="northwind.example" {...props} />
    </div>
  );
  return leave ? <Left>{field}</Left> : field;
}

function AddWebsite(): React.JSX.Element {
  const [report, setReport] = useState<{ url: string; valid: boolean } | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (report?.valid) setSaved(report.url);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Add your studio website</h2>
        <p className="text-xs text-muted-foreground">Paste a whole link, or type just the domain.</p>
      </div>
      <Field
        name="website"
        onValueChange={(url, state) => {
          setReport({ url, valid: state.valid });
          setSaved(null);
        }}
      />
      <Button type="submit" disabled={!report?.valid}>
        Save website
      </Button>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {saved ? (
          <span>Saved {saved}</span>
        ) : report ? (
          <>
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] break-all text-foreground">
              {JSON.stringify(report.url)}, valid: {String(report.valid)}
            </code>
          </>
        ) : (
          <span>Nothing reported yet</span>
        )}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: paste https://halcyon.example/studio?ref=press, or type northwind.example">
          <AddWebsite />
        </Example>
        <Example caption="A bare domain is reported with https in front. A valid address gets a link that opens a new tab">
          <Field defaultValue="northwind.example" />
        </Example>
        <Example caption="A pasted link keeps its path: the protocol moves into the menu, the rest stays">
          <Field defaultValue="https://halcyon.example/work/kestrel-rebrand?ref=press" />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="requireHttps refuses http and says why, with a way out">
          <Field defaultValue="http://kestrel.example" requireHttps leave />
        </Example>
        <Example caption="allowPath={false} keeps the field to a bare domain">
          <Field defaultValue="https://northwind.example/pricing" allowPath={false} leave />
        </Example>
        <Example caption="A host without a dot is explained, not just flagged">
          <Field defaultValue="kestrel" leave />
        </Example>
        <Example caption="Disabled">
          <Field defaultValue="https://tidewater.example" disabled />
        </Example>
      </div>
    </div>
  );
}
