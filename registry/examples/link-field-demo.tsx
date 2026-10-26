"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { LinkField, type LinkFieldProps, type LinkValue } from "@rhs-ui/primitives/link-field";

/** What the field reported, on one line that breaks at its spaces and never in the middle of a word. The readout is for the reader of the demo, so it is hidden from a screen reader. */
const show = (value: unknown): string => JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A field whose inputs have all been left once already, so the preview shows what it says afterwards. */
function Left({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Only when nothing has focus: a preview must never take it from a page the reader is already using.
    if (document.activeElement && document.activeElement !== document.body) return;
    for (const input of box.current?.querySelectorAll<HTMLInputElement>("input[type=text]") ?? []) {
      input.focus({ preventScroll: true });
      input.blur();
    }
    // The focus and blur leave the browser's starting point for the Tab key in the field; give it back to the page.
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute("tabindex");
  }, []);
  return <div ref={box}>{children}</div>;
}

function Field(props: LinkFieldProps): React.JSX.Element {
  return <LinkField {...props} />;
}

function EditButton(): React.JSX.Element {
  const [link, setLink] = useState<LinkValue>({ text: "Book a demo", href: "https://northwind.example/demo", newTab: true, rel: "noopener noreferrer" });
  const [valid, setValid] = useState(true);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Hero button</h2>
        <p className="text-xs text-muted-foreground">The call to action under the Northwind headline.</p>
      </div>
      <LinkField
        name="cta"
        label="Hero button link"
        hideLabel
        requireText
        value={link}
        onValueChange={(next, state) => {
          setLink(next);
          setValid(state.valid);
        }}
      />
      <p aria-hidden="true" className="grid gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span>Reported</span>
          <span>{valid ? "valid" : "not ready yet"}</span>
        </span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(link)}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: type northwind.example/pricing, /pricing, #faq, ines@orbit.example or +31 20 555 0142. Each is recognised in words">
          <EditButton />
        </Example>
        <Example caption="A path on the site: it can open in a new tab, but an anchor, an email or a phone link cannot">
          <Field label="Footer link" defaultValue={{ text: "Pricing", href: "/pricing", newTab: false }} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Empty: the hint says what fits, and the preview waits for text and a destination">
          <Field label="Menu item" />
        </Example>
        <Example caption="What could harm a visitor is refused, and allow keeps a field to the kinds you want">
          <Left>
            <Field label="Navigation link" requireText allow={["relative", "anchor"]} defaultValue={{ text: "", href: "https://northwind.example", newTab: false }} />
          </Left>
        </Example>
        <Example caption="Disabled">
          <Field label="Banner link" disabled defaultValue={{ text: "Read the changelog", href: "/changelog", newTab: false }} />
        </Example>
      </div>
    </div>
  );
}
