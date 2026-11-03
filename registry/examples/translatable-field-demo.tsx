"use client";

import { useState, type ReactNode } from "react";

import { TranslatableField, type TranslatableValue } from "@rhs-ui/application/translatable-field";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "de", label: "Deutsch" },
] as const;

/** A caption above a case, in the quiet voice the rest of the demo uses. */
function Case({ caption, children, wide = false }: { caption: ReactNode; children: ReactNode; wide?: boolean }): React.JSX.Element {
  return (
    <div className={wide ? "grid min-w-0 content-start gap-3 @3xl:col-span-2 @3xl:row-span-2 @3xl:grid-rows-subgrid" : "grid min-w-0 content-start gap-3 @3xl:row-span-2 @3xl:grid-rows-subgrid"}>
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** What the field reported last, as the code that receives it would see it. */
function Report({ value }: { value: TranslatableValue }): React.JSX.Element {
  return <p className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-[0.6875rem] leading-5 text-muted-foreground [overflow-wrap:anywhere]">{JSON.stringify(value)}</p>;
}

export default function Demo(): React.JSX.Element {
  const [headline, setHeadline] = useState<TranslatableValue>({ en: "Welcome to Northwind", nl: "Welkom bij Northwind" });
  const [blank, setBlank] = useState<TranslatableValue>({ nl: "Gratis verzending vanaf 50 euro" });
  const [about, setAbout] = useState<TranslatableValue>({
    en: "Hand-stitched leather weekender with a brass zip and a detachable shoulder strap.",
    nl: "Handgestikte leren weekendtas met een messing rits en een afneembare schouderband.",
    de: "Handgenähte Weekender-Tasche aus Leder mit Messingreißverschluss, abnehmbarem Schultergurt und einem geräumigen Innenfach mit Reißverschluss.",
  });

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-4xl gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Case caption="Two of three languages have their text. Choose Deutsch, then Copy from English: it fills the field and can be undone. Arrow keys move between the tabs.">
          <div className="grid gap-3">
            <TranslatableField label="Homepage headline" locales={LOCALES} value={headline} onValueChange={setHeadline} maxLength={60} />
            <Report value={headline} />
          </div>
        </Case>

        <Case caption="After a failed submit, the required language is the default one. Its tab says Required, and the field says why.">
          <div className="grid gap-3">
            <TranslatableField label="Shipping banner" locales={LOCALES} value={blank} onValueChange={setBlank} required invalid />
            <Report value={blank} />
          </div>
        </Case>

        <Case wide caption="A longer text with a guide length. The German is over it: the tab says so, and the count turns red when you open it. A text over the guide is allowed, so a long translation is never cut off.">
          <TranslatableField label="Product description" locales={LOCALES} value={about} onValueChange={setAbout} multiline maxLength={110} />
        </Case>
      </div>
    </div>
  );
}
