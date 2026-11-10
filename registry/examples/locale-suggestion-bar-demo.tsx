"use client";

import { useState } from "react";

import { LocaleSuggestionBar } from "@rhs-ui/marketing/locale-suggestion-bar";
import { Button } from "@rhs-ui/primitives/button";

const ENGLISH = { code: "en", label: "English", href: "/" };

export default function Demo(): React.JSX.Element {
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState("");

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          A German visitor on the English site. The bar is a region in German, so a screen reader speaks the question with the right voice. Any button removes it for good; what you store is up to you.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <LocaleSuggestionBar
            key={round}
            current={ENGLISH}
            suggested={{
              code: "de",
              label: "Deutsch",
              href: "#de",
              question: "Möchten Sie die deutsche Website sehen?",
              switchLabel: "Wechseln",
              stayLabel: "Hier bleiben",
              closeLabel: "Schließen",
            }}
            onSwitch={() => setChoice("onSwitch: store “de”, the link takes them there.")}
            onStay={() => setChoice("onStay: store “en”, and do not show the bar again.")}
            onDismiss={() => setChoice("onDismiss: closed without choosing.")}
          />
          <header className="flex h-16 items-center justify-between border-b border-border px-6">
            <span className="text-base font-semibold tracking-tight">Alder &amp; Co.</span>
            <nav aria-label="Demo" className="hidden gap-6 text-sm text-muted-foreground sm:flex">
              <span>Sofas</span>
              <span>Tables</span>
              <span>Storage</span>
              <span>Repairs</span>
            </nav>
          </header>
          <section className="mx-auto grid max-w-2xl justify-items-center gap-4 px-6 py-14 text-center">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Furniture made to be repaired</p>
            <h2 className="text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Buy one table. Keep it for forty years.</h2>
            <p className="min-h-5 text-xs text-muted-foreground" role="status">
              {choice}
            </p>
            {choice ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChoice("");
                  setRound((n) => n + 1);
                }}
              >
                Show the bar again
              </Button>
            ) : null}
          </section>
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">The same bar for a Dutch visitor. Every word on it, the buttons and the close included, is in the language it offers.</figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <LocaleSuggestionBar
            current={ENGLISH}
            suggested={{
              code: "nl",
              label: "Nederlands",
              href: "#nl",
              question: "Wilt u de Nederlandse website bekijken?",
              switchLabel: "Wisselen",
              stayLabel: "Blijven",
              closeLabel: "Sluiten",
            }}
          />
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Translations run longer than English. When the buttons do not fit side by side, Stay drops under Switch, so nothing is ever cut off, and the short labels above still share one line.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <LocaleSuggestionBar
            current={ENGLISH}
            suggested={{
              code: "fr",
              label: "Français",
              href: "#fr",
              question: "Souhaitez-vous consulter la version française du site ?",
              switchLabel: "Passer à la version française",
              stayLabel: "Rester sur la version anglaise",
              closeLabel: "Fermer",
            }}
          />
        </div>
      </figure>
    </div>
  );
}
