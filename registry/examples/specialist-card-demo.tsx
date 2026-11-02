"use client";

import { useState, type ReactNode } from "react";

import { SpecialistCard } from "@rhs-ui/application/specialist-card";

// A fixed "now" keeps "today" and "tomorrow" the same on every load. In an app, leave `now` out and the card reads the browser's clock.
const NOW = Date.parse("2026-11-02T09:30:00+01:00");

/** A head and shoulders, drawn in flat shapes. Use real photos in an app. */
const portrait = (ground: string, ink: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'><rect width='72' height='72' fill='${ground}'/><circle cx='36' cy='28' r='12' fill='${ink}'/><path d='M12 72c1-15 11-24 24-24s23 9 24 24z' fill='${ink}'/></svg>`);

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const ZONE = { now: NOW, locale: "en-GB", timeZone: "Europe/Amsterdam" } as const;

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");
  const book = (name: string) => () => setNote(`Opening the booking calendar for ${name}.`);

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Free tomorrow: the slot is written the way a person says it.">
        <SpecialistCard
          name="Dr. Mara Okafor"
          role="Cardiologist"
          image={portrait("#e5e2dc", "#a39d91")}
          rating={4.9}
          ratingCount={128}
          specialties={["Heart failure", "Prevention", "Women's heart health"]}
          languages={["English", "Dutch", "Polish"]}
          nextAvailable="2026-11-03T10:30:00+01:00"
          href="#mara-okafor"
          onBook={book("Dr. Mara Okafor")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Later this week: the weekday and the time.">
        <SpecialistCard
          name="Lena Fischer"
          role="Physiotherapist"
          image={portrait("#2f3236", "#6b7078")}
          rating={4.8}
          ratingCount={212}
          specialties={["Back pain", "Sports injuries"]}
          languages={["German", "English"]}
          nextAvailable="2026-11-05T14:15:00+01:00"
          href="#lena-fischer"
          onBook={book("Lena Fischer")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Free today, and not reviewed yet.">
        <SpecialistCard
          name="Dr. Ines Kowalski"
          role="Dermatologist"
          rating={0}
          ratingCount={0}
          specialties={["Skin checks", "Eczema"]}
          languages={["Polish", "English", "German"]}
          nextAvailable="2026-11-02T16:45:00+01:00"
          href="#ines-kowalski"
          onBook={book("Dr. Ines Kowalski")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="No slots this week: it says so and disables Book.">
        <SpecialistCard
          name="Jonas Weber"
          role="Dietitian"
          image={portrait("#d9d2c3", "#8c8473")}
          rating={4.6}
          ratingCount={64}
          specialties={["Sports nutrition", "Gut health"]}
          languages={["German", "English"]}
          nextAvailable={null}
          href="#jonas-weber"
          onBook={book("Jonas Weber")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <p role="status" className="min-h-4 text-xs text-muted-foreground md:col-span-2">
        {note}
      </p>
    </div>
  );
}
