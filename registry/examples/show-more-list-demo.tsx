"use client";

import type { ReactNode } from "react";

import { Rating } from "@rhs-ui/primitives/rating";
import { ShowMoreList } from "@rhs-ui/primitives/show-more-list";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

interface Review {
  name: string;
  date: string;
  stars: number;
  text: string;
}

const REVIEWS: readonly Review[] = [
  { name: "Joris B.", date: "14 Oct 2026", stars: 5, text: "Pulls a proper shot in under a minute from cold. The steam wand is the best I have used at this price." },
  { name: "Anneke V.", date: "9 Oct 2026", stars: 5, text: "Quiet, quick and easy to clean. We replaced the machine at the office with three of these." },
  { name: "Samir K.", date: "2 Oct 2026", stars: 4, text: "Great coffee. The drip tray is small, so I empty it every morning, but that is my only complaint." },
  { name: "Lotte H.", date: "27 Sep 2026", stars: 5, text: "Setup took ten minutes. The grind guide in the app made my first week of espresso far better." },
  { name: "Daan M.", date: "21 Sep 2026", stars: 3, text: "Good machine, but the water tank is awkward to fill under a low shelf." },
  { name: "Priya N.", date: "18 Sep 2026", stars: 5, text: "Consistent every day. Support answered within an hour when I asked about descaling." },
  { name: "Tom W.", date: "12 Sep 2026", stars: 4, text: "Looks lovely on the counter and heats up fast. Would like a second portafilter in the box." },
  { name: "Eva R.", date: "7 Sep 2026", stars: 5, text: "A real step up from my old pod machine. Flat whites finally taste like the café’s." },
  { name: "Bram J.", date: "30 Aug 2026", stars: 4, text: "Solid build. The first descale needed a call to support, then it was easy." },
  { name: "Noor A.", date: "24 Aug 2026", stars: 5, text: "Perfect for a small kitchen. The pressure gauge is a nice touch for learning." },
];

const RELEASES = [
  { version: "2.8.0", date: "13 Oct 2026", note: "Bulk edit for invoices, and a faster export for very large workspaces." },
  { version: "2.7.2", date: "29 Sep 2026", note: "Fixes a rounding error in multi-currency totals." },
  { version: "2.7.0", date: "15 Sep 2026", note: "Saved views on every table, shared with your team." },
  { version: "2.6.1", date: "1 Sep 2026", note: "The command menu now remembers your recent searches." },
  { version: "2.6.0", date: "18 Aug 2026", note: "Webhooks for payment events, with a delivery log." },
  { version: "2.5.3", date: "4 Aug 2026", note: "Keyboard shortcuts are listed under the help menu." },
  { version: "2.5.0", date: "21 Jul 2026", note: "Two-factor sign-in with passkeys." },
] as const;

const OFFICES = [
  { city: "Amsterdam", address: "Keizersgracht 244" },
  { city: "Rotterdam", address: "Wijnhaven 61" },
  { city: "Utrecht", address: "Oudegracht 112" },
  { city: "Eindhoven", address: "Stratumseind 18" },
  { city: "Groningen", address: "Oude Ebbingestraat 9" },
  { city: "Maastricht", address: "Markt 5" },
] as const;

function ReviewRow({ review }: { review: Review }): React.JSX.Element {
  return (
    <article className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm font-medium">{review.name}</p>
        <Rating readOnly value={review.stars} size={14} label={`${review.name} rated it`} />
        <p className="text-xs text-muted-foreground">{review.date}</p>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{review.text}</p>
    </article>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Reviews: three show, the button names the seven it reveals, and focus stays on it">
        <div className="max-w-xl rounded-xl border border-border bg-card p-5 shadow-xs">
          <h2 className="mb-4 text-sm font-medium">Reviews of the Northwind Espresso One</h2>
          <ShowMoreList
            items={REVIEWS}
            renderItem={(review) => <ReviewRow review={review} />}
            getKey={(review) => review.name + review.date}
            initialCount={3}
            noun={{ one: "review", other: "reviews" }}
            listClassName="gap-0 divide-y divide-border"
            itemClassName="py-4 first:pt-0"
          />
        </div>
      </Example>

      <div className="grid gap-10 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Example caption="In chunks with step, as an ordered list: newest first">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-4 text-sm font-medium">Release notes</h2>
            <ShowMoreList
              as="ol"
              items={RELEASES}
              renderItem={(release) => (
                <div className="grid gap-0.5">
                  <p className="flex items-baseline gap-2 text-sm font-medium">
                    <span className="tabular-nums">{release.version}</span>
                    <span className="text-xs font-normal text-muted-foreground">{release.date}</span>
                  </p>
                  <p className="text-[0.8125rem] leading-5 text-muted-foreground">{release.note}</p>
                </div>
              )}
              initialCount={2}
              step={2}
              noun={{ one: "release", other: "releases" }}
              listClassName="gap-4"
            />
          </div>
        </Example>

        <Example caption="From a Server Component, pass the drawn items as children">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-4 text-sm font-medium">Our offices</h2>
            <ShowMoreList initialCount={3} noun={{ one: "office", other: "offices" }} listClassName="gap-3">
              {OFFICES.map((office) => (
                <p key={office.city} className="text-sm">
                  <span className="font-medium">{office.city}</span>
                  <span className="block text-[0.8125rem] text-muted-foreground">{office.address}</span>
                </p>
              ))}
            </ShowMoreList>
          </div>
        </Example>
      </div>
    </div>
  );
}
