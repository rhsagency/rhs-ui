import { HeadlineStat } from "@rhs-ui/marketing/headline-stat";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          One claim and three footnotes. The big figure is a number, so it counts up once as it scrolls into view and stands still under reduced motion; its final value is in the page from the start, for screen readers and for print.
        </figcaption>
        <HeadlineStat
          value={2.4}
          decimals={1}
          suffix="M"
          label="parcels delivered in 2026"
          description="Every one scanned at hand-over, from a warehouse in Venlo to a front door in Gdańsk."
          supporting={[
            { value: "98.7%", label: "delivered on the day we promised" },
            { value: "41", label: "countries with a daily route" },
            { value: "12 min", label: "median time to a human reply" },
          ]}
          source={{ text: "Northwind delivery data, 1 January to 31 October 2026. A parcel is counted once, at hand-over to the recipient.", href: "https://example.com/northwind/how-we-count" }}
        />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          A figure given as text is set as written, and a long one shrinks to its column instead of running over. Two footnotes are enough, and without a source the line simply goes.
        </figcaption>
        <HeadlineStat
          value="$128.4M"
          label="paid out to independent sellers"
          description="Four days from sale to bank account, whatever the size of the shop."
          supporting={[
            { value: "3,100", label: "shops paid every Friday" },
            { value: "4 days", label: "from sale to payout" },
          ]}
          className="py-8 sm:py-12"
        />
      </figure>
    </div>
  );
}
