import { IconBag, IconBook, IconCalendar, IconDownload, IconMail, IconPodcast, IconVideo } from "@rhs-ui/icons";
import { CreatorHero } from "@rhs-ui/marketing/creator-hero";

/* A portrait drawn for the demo, so it needs no file. In your site: your own picture, square, at least 192 pixels wide. */
const portrait =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='#d8d8d8'/><path d='M30 46c0-15 8-24 20-24s20 9 20 24v28H30z' fill='#2b2b2b'/><path d='M12 100c2-22 18-32 38-32s36 10 38 32z' fill='#4a4a4a'/><rect x='44' y='56' width='12' height='14' rx='5' fill='#a5a5a5'/><ellipse cx='50' cy='45' rx='15' ry='17' fill='#b9b9b9'/><path d='M34 42c1-11 7-17 16-17s15 6 16 17c-4-4-10-6-16-6s-12 2-16 6z' fill='#2b2b2b'/></svg>`,
  );

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl items-start gap-6 px-6 py-6 md:grid-cols-2">
      <div className="flex min-w-0 flex-col">
        <p className="mb-3 text-xs text-muted-foreground">A creator with a picture, three numbers, a solid first link and a New tag.</p>
        <div className="rounded-2xl border border-border bg-background">
          <CreatorHero
            name="Marlowe Reyes"
            handle="@marlowe.makes"
            bio="Ceramicist and podcaster in Rotterdam. A new glaze every second Friday."
            avatar={portrait}
            stats={[
              { label: "Followers", value: 48200 },
              { label: "Subscribers", value: 12400 },
              { label: "Episodes", value: 86 },
            ]}
            links={[
              { label: "Listen to the latest episode", href: "https://example.com/podcast", icon: <IconPodcast />, featured: true },
              { label: "Spring studio sale", href: "https://example.com/shop", icon: <IconBag />, badge: "new" },
              { label: "Watch the glaze tests", href: "https://example.com/videos", icon: <IconVideo /> },
              { label: "Join the Friday newsletter", href: "#newsletter", icon: <IconMail /> },
            ]}
            socials={[
              { label: "Instagram", href: "https://example.com/instagram" },
              { label: "YouTube", href: "https://example.com/youtube" },
              { label: "Spotify", href: "https://example.com/spotify" },
            ]}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <p className="mb-3 text-xs text-muted-foreground">No picture, so the initials are drawn. A speaker with three links and no tags.</p>
        <div className="rounded-2xl border border-border bg-background">
          <CreatorHero
            name="Dr. Amara Osei"
            handle="@amaraspeaks"
            bio="Keynote speaker on slow technology. Taking bookings for 2027."
            stats={[
              { label: "Talks", value: 120 },
              { label: "Countries", value: 18 },
              { label: "Readers", value: 31500 },
            ]}
            links={[
              { label: "Book Amara for your event", href: "#book", icon: <IconCalendar />, featured: true },
              { label: "Read The Quiet Stack", href: "https://example.com/book", icon: <IconBook />, badge: "soon" },
              { label: "Download the speaker kit", href: "https://example.com/kit.pdf", icon: <IconDownload /> },
            ]}
            socials={[
              { label: "LinkedIn", href: "https://example.com/linkedin" },
              { label: "Newsletter", href: "https://example.com/newsletter" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
