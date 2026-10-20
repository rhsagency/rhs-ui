import { IconArrowRight, IconCode } from "@rhs-ui/icons";
import { OpenSourceHero } from "@rhs-ui/marketing/open-source-hero";
import { Button } from "@rhs-ui/primitives/button";

/* Portraits drawn for the demo so it needs no images. In your app: each contributor's real avatar URL. */
const tones = [
  ["#d9d7d2", "#7a776f"],
  ["#c6c4be", "#5c5953"],
  ["#e5e3de", "#8d8a83"],
  ["#bcbab4", "#4a4843"],
  ["#dddbd6", "#686560"],
];
function portrait(index: number): string {
  const [ground, figure] = tones[index % tones.length] ?? ["#ddd", "#777"];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='${ground}'/><circle cx='20' cy='16' r='7' fill='${figure}'/><path d='M5 40c0-9 7-14 15-14s15 5 15 14Z' fill='${figure}'/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const people = ["Mara Lindqvist", "Tomás Herrera", "Priya Raman", "Jun Takahashi", "Elif Demir", "Noah Fischer"].map((name, index) => ({ name, src: portrait(index) }));

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <OpenSourceHero
        name="Halcyon"
        description="A type-safe job queue for Node and Bun. Postgres in, retries out, nothing else to run."
        install="npm install @halcyon/queue"
        actions={
          <>
            <Button asChild size="lg">
              <a href="#get-started">
                Get started
                <IconArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#source">
                <IconCode />
                Read the source
              </a>
            </Button>
          </>
        }
        repo={{
          stars: 18402,
          forks: 1287,
          issues: 143,
          release: "v2.4.0",
          releasedAt: "2026-10-12",
          license: "MIT",
          languages: [
            { name: "TypeScript", share: 78.4 },
            { name: "Rust", share: 14.1 },
            { name: "CSS", share: 4.6 },
            { name: "Shell", share: 1.7 },
            { name: "Other", share: 1.2 },
          ],
          contributors: { total: 214, people },
        }}
      />
    </div>
  );
}
