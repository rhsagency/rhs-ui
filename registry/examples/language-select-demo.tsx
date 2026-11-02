"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { LanguageSelect, type LanguageSelectProps } from "@rhs-ui/primitives/language-select";
import { cn } from "@/lib/utils";

/**
 * Holds the room a list that starts open needs, so the preview shows it whole and covers nothing. The room goes
 * back when the person uses what it holds (a press that ends in it, or a key in it), and never for a press
 * elsewhere on the page, or a swipe that scrolls it: a page that shrinks above a finger moves the very thing the
 * finger was about to tap.
 */
function Reserve({ className, children }: { className: string; children: ReactNode }): React.JSX.Element {
  const [reserved, setReserved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // A moment after the press ends, so that a control that moves away under the pointer still gets its click. A key sent by the demo itself is not use.
  const used = (event: SyntheticEvent) => {
    if (!event.nativeEvent.isTrusted) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReserved(false), 300);
  };
  return (
    <div onPointerUp={used} onKeyDown={used} className={cn("transition-[min-height] duration-200 ease-out motion-reduce:transition-none", reserved ? className : "min-h-0")}>
      {children}
    </div>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The visible label also names the list, so what is seen and what is said are the same words. */
function Field({ label, ...props }: { label: string } & Omit<LanguageSelectProps, "id" | "label">): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <LanguageSelect id={id} label={label} {...props} />
    </div>
  );
}

function Settings(): React.JSX.Element {
  const id = useId();
  const [language, setLanguage] = useState("de");
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Choose the Halcyon language</h2>
        <p className="text-xs text-muted-foreground">Every language is named in itself and in English. The three most used are on top.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Interface language</Label>
        <Reserve className="min-h-[30rem]">
          <LanguageSelect id={id} name="language" suggested={["en", "nl", "de"]} alsoSearch={["en", "fr", "de"]} value={language} onValueChange={setLanguage} defaultOpen placement="bottom" />
        </Reserve>
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(language)}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: type ger, deut or allem, and each finds German">
        <Settings />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Only the languages you ship: four codes, and nothing else to download">
          <Field label="Site language" languages={["en", "fr", "de", "es"]} suggested={["en"]} defaultValue="fr" />
        </Example>
        <Example caption="The names and the words of the list in Dutch, and a right-to-left language that keeps its own direction">
          <div className="grid gap-5">
            <Field
              label="Taal van de app"
              locale="nl"
              suggested={["nl", "en"]}
              defaultValue="de"
              placeholder="Kies een taal"
              searchPlaceholder="Talen zoeken..."
              emptyText="Geen taal gevonden."
              messages={{ suggested: "Voorgesteld", allLanguages: "Alle talen", selected: "geselecteerd", search: (label) => `${label} zoeken` }}
            />
            <Field label="Customer's language" defaultValue="ar" />
          </div>
        </Example>
        <Example caption="Disabled">
          <Field label="Locked by your workspace" disabled defaultValue="fr" />
        </Example>
      </div>
    </div>
  );
}
