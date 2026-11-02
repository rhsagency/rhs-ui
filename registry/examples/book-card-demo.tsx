import type { ReactNode } from "react";

import { BookCard, type BookCardProps } from "@rhs-ui/application/book-card";

/** Jackets drawn in flat shapes, so the demo needs no files. Use real covers in an app. */
const art = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'>${body}</svg>`);

const words = (text: string, y: number, size: number, ink: string, spacing = 0) =>
  `<text x='200' y='${y}' text-anchor='middle' font-family='Georgia, serif' font-size='${size}' letter-spacing='${spacing}' fill='${ink}'>${text}</text>`;

const SALT_ROAD = art(
  `<rect width='400' height='600' fill='#e8dfcc'/>` +
    `<circle cx='200' cy='240' r='88' fill='#b4634a'/>` +
    `<rect y='320' width='400' height='280' fill='#2f2b27'/>` +
    `<path d='M184 320h32l112 280H72z' fill='#e8dfcc'/>` +
    `<path d='M200 330v270' stroke='#2f2b27' stroke-width='5' stroke-dasharray='20 24'/>` +
    words("THE SALT ROAD", 86, 33, "#2f2b27", 5) +
    words("ILSE VERBEEK", 126, 16, "#2f2b27", 5),
);

const SMALL_OCEAN = art(
  `<rect width='400' height='600' fill='#1f2a36'/>` +
    `<circle cx='296' cy='238' r='38' fill='#e9e3d3'/>` +
    [330, 372, 414, 456, 498, 540].map((y, i) => `<path d='M-20 ${y}q50 -26 100 0t100 0t100 0t100 0t100 0' fill='none' stroke='#cfd8df' stroke-width='${3 + (i % 2)}' opacity='${(0.9 - i * 0.1).toFixed(2)}'/>`).join("") +
    words("A SMALL", 84, 38, "#e9e3d3", 8) +
    words("OCEAN", 128, 38, "#e9e3d3", 8),
);

const QUIET_MACHINES = art(
  `<rect width='400' height='600' fill='#efede8'/>` +
    `<circle cx='200' cy='246' r='120' fill='#1b1b1b'/>` +
    `<rect x='168' y='214' width='64' height='64' fill='#efede8'/>` +
    `<rect x='64' y='424' width='272' height='3' fill='#1b1b1b'/>` +
    words("Quiet Machines", 488, 42, "#1b1b1b") +
    words("PRIYA NAIR", 538, 16, "#1b1b1b", 6),
);

const FIELD_NOTES = art(
  `<rect width='400' height='600' fill='#c9d3c0'/>` +
    `<ellipse cx='132' cy='292' rx='44' ry='146' fill='#5d7260' transform='rotate(-22 132 292)'/>` +
    `<ellipse cx='214' cy='262' rx='40' ry='170' fill='#46594a' transform='rotate(6 214 262)'/>` +
    `<ellipse cx='292' cy='304' rx='38' ry='132' fill='#7d9180' transform='rotate(26 292 304)'/>` +
    `<rect x='60' y='452' width='280' height='3' fill='#26332a'/>` +
    words("Field Notes", 506, 40, "#26332a") +
    words("on Silence", 550, 28, "#26332a"),
);

const SHELF: BookCardProps[] = [
  { title: "The Salt Road", authors: ["Ilse Verbeek"], cover: SALT_ROAD, rating: 4.6, ratingCount: 1284, formats: ["print", "ebook", "audio"], availability: "available" },
  { title: "A Small Ocean", authors: ["Tom Calder", "Ana Ruiz"], cover: SMALL_OCEAN, rating: 4.2, ratingCount: 386, formats: ["print", "ebook"], availability: "out", dueDate: "2026-11-12" },
  { title: "Lighthouse Keepers", authors: ["Marit Hendriks"], formats: ["print"], availability: "reserved" },
];

const STORE: BookCardProps[] = [
  { title: "Quiet Machines", authors: ["Priya Nair"], cover: QUIET_MACHINES, rating: 4.8, ratingCount: 92, formats: ["ebook", "audio"], availability: "available", price: 14.99 },
  { title: "Field Notes on Silence", authors: ["Leo Martins"], cover: FIELD_NOTES, rating: 4.1, ratingCount: 1, formats: ["print"], availability: "available", price: 21 },
];

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl gap-x-8 gap-y-10 md:grid-cols-2">
      <Case caption="A list, as a library shows it: shelf, loan, reserved.">
        <div className="grid gap-3">
          {SHELF.map((book) => (
            <BookCard key={book.title} {...book} href="#" locale="en-GB" timeZone="Europe/Amsterdam" />
          ))}
        </div>
      </Case>
      <Case caption="A grid, as a bookshop shows it: the price at the foot.">
        <div className="grid grid-cols-2 gap-3">
          {STORE.map((book) => (
            <BookCard key={book.title} {...book} href="#" orientation="vertical" locale="en-GB" timeZone="Europe/Amsterdam" />
          ))}
        </div>
      </Case>
    </div>
  );
}
