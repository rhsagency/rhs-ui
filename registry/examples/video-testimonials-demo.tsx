import { VideoTestimonials, type TestimonialVideo } from "@rhs-ui/marketing/video-testimonials";

export default function Demo(): React.JSX.Element {
  const videos = demoVideos();
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Three customers on camera. Each card is one button named like "Play Maria's story, 2 minutes 14 seconds"; the poster is always there, the video fetches nothing until a press. A press opens a dialog and starts the video (the first one has captions on); Escape or the close button stops it and returns focus to the card.
        </figcaption>
        <VideoTestimonials title="Hear it from the people who run on it" description="A few minutes each, in their own words." videos={videos} className="py-2 sm:py-4" />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Hosted elsewhere? `renderPlayer` puts your embed in the same dialog and mounts it only after the press. Here a stand-in frame plays that part, for two customers. The second has no poster (or its poster failed to load), so its card shows the initials in a small tile in the corner and keeps the middle for the play button.
        </figcaption>
        <VideoTestimonials
          title="Watch how they rolled it out"
          videos={videos.slice(1).map(({ src: _src, captions: _captions, ...video }, index) => (index === 1 ? { ...video, poster: "" } : video))}
          renderPlayer={(video) => (
            <iframe
              title={`${video.name}, ${video.role}`}
              srcDoc={`<body style="margin:0;display:grid;place-items:center;height:100vh;background:#111;color:#e6e6e6;font:15px system-ui,sans-serif">Your embedded player for ${video.name}</body>`}
              className="absolute inset-0 size-full border-0"
            />
          )}
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}

// Below: the data the demo shows, and the pictures and the film it draws for it.

type Hair = "bun" | "short" | "long";

/** The three customers on camera. A function, so it reads the film and the captions declared below it. */
function demoVideos(): readonly TestimonialVideo[] {
  return [
    {
      id: "maria",
      name: "Maria Alvarez",
      role: "Head of operations, Northwind Logistics",
      poster: poster("#d9d9d9", "#c4c4c4", "#4d4d4d", "bun", "left"),
      src: CLIP,
      duration: "2:14",
      captions: { src: CAPTIONS, lang: "en", label: "English" },
    },
    {
      id: "tomas",
      name: "Tomás Herrera",
      role: "Finance director, Kestrel Studio",
      poster: poster("#2c2c2c", "#3b3b3b", "#d2d2d2", "short", "right", "#151515"),
      src: CLIP,
      duration: "1:48",
    },
    {
      id: "ingrid",
      name: "Ingrid Solheim",
      role: "Co-founder, Polder Health",
      poster: poster("#bcbcbc", "#a9a9a9", "#2f2f2f", "long", "left"),
      src: CLIP,
      duration: "3:05",
    },
  ];
}

/** Four seconds of a calm pulse in grey, as a small silent WebM. In your page: your own video file. */
const CLIP = "data:video/webm;base64,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";

/** One line of captions for it, as WebVTT. */
const CAPTIONS = "data:text/vtt;charset=utf-8," + encodeURIComponent("WEBVTT\n\n00:00.000 --> 00:04.000\nWe moved a hundred and forty drivers in a weekend.\n");

/**
 * A 16:9 frame drawn for the demo: a person in an interview shot, standing to one side so the play button lands on open ground
 * and not on their face, with the window and the lamp on the other side. In your page: a still from the film.
 */
function poster(ground: string, accent: string, shirt: string, hair: Hair, side: "left" | "right", ink = "#383838"): string {
  const behind = hair === "long" ? `<path d='M274 104c0-46 18-66 46-66s46 20 46 66v66H274z' fill='${ink}'/>` : "";
  const above =
    hair === "bun"
      ? `<circle cx='320' cy='40' r='17' fill='${ink}'/><path d='M277 94c0-34 17-52 43-52s43 18 43 52c-12-15-25-19-43-19s-31 4-43 19z' fill='${ink}'/>`
      : hair === "short"
        ? `<path d='M277 96c0-36 17-56 43-56s43 20 43 56c-12-17-25-21-43-21s-31 4-43 21z' fill='${ink}'/>`
        : `<path d='M277 94c0-32 17-52 43-52s43 20 43 52c-14-13-28-17-43-17s-29 4-43 17z' fill='${ink}'/>`;
  // The figure is drawn around x=320 and moved by this much: the head ends up near x=210 or x=430 of 640.
  const dx = side === "left" ? -110 : 110;
  const windowX = side === "left" ? 456 : 56;
  const lampX = side === "left" ? 92 : 548;
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'><rect width='640' height='360' fill='${ground}'/><rect x='${windowX}' y='40' width='128' height='188' rx='8' fill='${accent}'/><rect x='${windowX + 14}' y='54' width='52' height='160' rx='4' fill='${ground}' opacity='.5'/><circle cx='${lampX}' cy='96' r='38' fill='${accent}' opacity='.8'/><g transform='translate(${dx} 0)'><circle cx='320' cy='124' r='128' fill='${accent}' opacity='.45'/>${behind}<rect x='302' y='132' width='36' height='90' fill='#8c8c8c'/><circle cx='320' cy='96' r='42' fill='#a4a4a4'/>${above}<path d='M166 360c6-100 66-150 154-150s148 50 154 150z' fill='${shirt}'/></g></svg>`,
    )
  );
}
