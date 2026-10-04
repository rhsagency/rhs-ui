import { LinkPreview } from "@rhs-ui/primitives/link-preview";

const image = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'><rect width='1200' height='630' fill='#2b2e33'/><text x='80' y='360' font-family='Arial' font-size='88' fill='#f4f1ea'>Field Notes</text></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-xl justify-items-start gap-6 p-8">
      <LinkPreview href="https://example.com/notes/four-day-week" image={image} title="What happened when we closed on Fridays" description="Six months of a four-day week, measured in releases, sick days and support tickets." />
      <LinkPreview layout="row" href="https://example.com/notes/decision-log" image={image} title="The decision log that outlived three reorgs" description="Why our most useful document is a list of things we decided not to do." />
    </div>
  );
}
