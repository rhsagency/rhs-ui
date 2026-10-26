"use client";

import { useRef, type ReactNode } from "react";

import { TranslateToggle, type TranslateLabels, type TranslateState } from "@rhs-ui/application/translate-toggle";
import { IconStar } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Review {
  id: string;
  name: string;
  place: string;
  stars: number;
  language: string;
  locale: string;
  text: string;
  translation: string;
}

const REVIEWS: Review[] = [
  {
    id: "femke",
    name: "Femke de Wit",
    place: "Utrecht",
    stars: 5,
    language: "Dutch",
    locale: "nl",
    text: "Prachtige eettafel, precies zoals op de foto. De levering was snel en de montage was zo gedaan. We zitten er elke avond met zes man aan.",
    translation: "A beautiful dining table, exactly as in the photo. Delivery was quick and putting it together took no time. Six of us sit at it every evening.",
  },
  {
    id: "jonas",
    name: "Jonas Keller",
    place: "Hamburg",
    stars: 4,
    language: "German",
    locale: "de",
    text: "Sehr stabil und schön verarbeitet. Die Lieferung hat allerdings eine Woche länger gedauert als angekündigt, und niemand hat uns Bescheid gesagt.",
    translation: "Very sturdy and nicely made. Delivery did take a week longer than announced, though, and nobody told us.",
  },
];

function Stars({ value }: { value: number }): React.JSX.Element {
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <IconStar key={index} className={index < value ? "size-3.5 fill-current" : "size-3.5 text-border"} />
      ))}
    </span>
  );
}

function ReviewItem({ review, failFirst = false }: { review: Review; failFirst?: boolean }): React.JSX.Element {
  const spent = useRef(!failFirst);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] gap-3 px-4 py-5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-[1_1_10rem] items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{initialsOf(review.name)}</AvatarFallback>
          </Avatar>
          <p className="min-w-0 text-sm leading-snug">
            <span className="font-medium">{review.name}</span>
            <span className="text-muted-foreground"> &middot; {review.place}</span>
          </p>
        </div>
        <Stars value={review.stars} />
      </div>
      <TranslateToggle
        text={review.text}
        sourceLanguage={review.language}
        sourceLocale={review.locale}
        targetLanguage="English"
        onTranslate={async () => {
          await wait(900);
          if (!spent.current) {
            spent.current = true;
            throw new Error("offline");
          }
          return review.translation;
        }}
      />
    </li>
  );
}

const LATTE = "Lovely coffee, friendly people, and the sofa by the window is the best spot in town.";

const STATES: { state: TranslateState; caption: string }[] = [
  { state: "original", caption: "Original" },
  { state: "translating", caption: "Translating" },
  { state: "translated", caption: "Translated" },
  { state: "failed", caption: "Failed" },
];

const DUTCH: Partial<TranslateLabels> = {
  translate: "Vertaal naar het {language}",
  translating: "Bezig met vertalen…",
  translated: "Vertaald uit het {language}",
  showOriginal: "Toon origineel",
  failed: "Vertalen is mislukt, probeer het opnieuw",
  spokenTranslated: "De Nederlandse vertaling wordt getoond.",
  spokenOriginal: "De originele Engelse tekst wordt getoond.",
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="Reviews in other languages. Nothing is translated until you press the control; the German review fails the first time, to show the message.">
        <ul className="w-full divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {REVIEWS.map((review) => (
            <ReviewItem key={review.id} review={review} failFirst={review.id === "jonas"} />
          ))}
        </ul>
      </Example>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
        {STATES.map(({ state, caption }) => (
          <Example key={state} caption={caption}>
            {/* Each one starts in its state and then works: Translated can go back to the original, Original and Failed ask again. */}
            <TranslateToggle
              defaultState={state}
              text="Heerlijke koffie, vriendelijke mensen en de bank bij het raam is de beste plek van de stad."
              translation={state === "translated" ? LATTE : undefined}
              onTranslate={async () => {
                await wait(900);
                return LATTE;
              }}
              sourceLanguage="Dutch"
              sourceLocale="nl"
              targetLanguage="English"
            />
          </Example>
        ))}
        <Example caption="Your own words, for a Dutch shop">
          <TranslateToggle
            text="The coffee was excellent and the staff were lovely."
            sourceLanguage="Engels"
            sourceLocale="en"
            targetLanguage="Nederlands"
            locale="nl"
            labels={DUTCH}
            onTranslate={async () => {
              await wait(700);
              return "De koffie was uitstekend en het personeel was heerlijk vriendelijk.";
            }}
          />
        </Example>
      </div>
    </div>
  );
}
