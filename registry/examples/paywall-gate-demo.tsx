"use client";

import { useState, type ReactNode } from "react";

import { PaywallGate } from "@rhs-ui/marketing/paywall-gate";

/** The visible start of an article: what the reader has already read before the wall. */
function ArticleStart({ title, byline, children }: { title: string; byline: string; children: ReactNode }): React.JSX.Element {
  return (
    <header className="mx-auto max-w-2xl">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">The Harbour Review</p>
      <h2 className="mt-3 text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{byline}</p>
      <div className="mt-8 grid gap-5 text-lg leading-relaxed text-pretty">{children}</div>
    </header>
  );
}

export default function Demo(): React.JSX.Element {
  const [message, setMessage] = useState("");
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid gap-x-14 gap-y-20 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-8 text-xs text-muted-foreground">A metered wall under the first paragraphs of a story: the last lines fade out, and the offer rises over them. The reader sees why, and members have a way in.</p>
          <article>
            <ArticleStart title="The quiet return of the neighbourhood bakery" byline="By Marit de Vries · 6 min read">
              <p>
                On the first Saturday of March, a line formed outside a shopfront on Kade Street an hour before the doors opened. Nobody was selling anything rare. The people at the front had come for a loaf of bread, the kind that is baked within sight of the street and gone by noon.
              </p>
              <p>Ten years ago the number of independent bakeries in the city had halved. Rents rose, the supermarkets put ovens by their entrances and the small ovens went cold one by one. What changed since, the bakers say, is not nostalgia. It is arithmetic.</p>
            </ArticleStart>
            <PaywallGate
              headingLevel={3}
              className="paywall mt-5"
              teaser={
                <p>
                  Flour costs less than it did two years ago, a bakery needs far fewer people than a restaurant of the same size, and a street with a bakery on it, landlords have noticed, keeps its other shops open longer. Marta Okafor, who now runs three of them, puts it more plainly than any of the economists do.
                </p>
              }
              remaining="You have read 3 of 3 free articles this month"
              title="Keep reading with a free account"
              benefits={["Ten more stories every month, free", "The Saturday long read in your inbox", "Save stories and pick up where you stopped, on any device"]}
              price={{ amount: "Free", period: "No card needed" }}
              action={{ label: "Create your free account", href: "#create-account" }}
              signIn={{ href: "#sign-in" }}
            />
          </article>
        </div>

        <div className="min-w-0">
          <p className="mb-8 text-xs text-muted-foreground">A hard paywall with a price: no counter, a primary button that opens your own dialog, and the price in euros with its period</p>
          <article>
            <ArticleStart title="What the harbour cranes remember" byline="By Joost Haverkamp · 9 min read">
              <p>
                Before the container ships, there were the cranes. Four of them still stand on the east quay, painted the colour of rust and kept, the harbour authority insists, for reasons that have nothing to do with sentiment.
              </p>
            </ArticleStart>
            <PaywallGate
              headingLevel={3}
              className="mt-5"
              teaser={
                <p>
                  The reason is on a plaque nobody reads. It was the cranes that decided where the city would end, and every street map drawn since has had to agree with them, one way or another, about where the water starts. The harbour master, Femke Dijkstra, keeps a copy of the first one on her wall.
                </p>
              }
              eyebrow="Subscribers only"
              title="Subscribe to read the full story"
              benefits={["Every story, every day, with no limit", "The archive back to 1998", "Audio versions read by the writers"]}
              price={{ amount: 6, period: "a month, cancel any time" }}
              currency="EUR"
              locale="en-IE"
              action={{ label: "Start your subscription", onClick: () => setMessage("The subscription dialog would open here. Demo only: nothing is charged.") }}
              signIn={{ href: "#sign-in", label: "Sign in to your account" }}
            />
          </article>
          <p role="status" className="mt-4 min-h-6 text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
