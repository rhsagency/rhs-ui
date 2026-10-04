import { BlogFeatured } from "@rhs-ui/marketing/blog-featured";

const image = {
  src: "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='#d8d4cc'/><circle cx='560' cy='200' r='140' fill='#2b2d31'/><rect x='120' y='260' width='260' height='160' rx='16' fill='#8c867b'/></svg>"),
  alt: "Abstract composition of a dark circle and a stone block",
};

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <BlogFeatured
        title="This week in the journal"
        posts={[
          { id: "1", title: "The quiet interface: designing software that waits for you", excerpt: "Notifications, badges and streaks train people to check. We tried the opposite for a year.", href: "#", category: "Essay", date: "10 March 2026", dateTime: "2026-03-10", author: "Anouk de Wit", image },
          { id: "2", title: "What we learned from 400 onboarding calls", href: "#", category: "Research", date: "6 March 2026", dateTime: "2026-03-06" },
          { id: "3", title: "Pricing pages that do not shout", href: "#", category: "Design", date: "1 March 2026", dateTime: "2026-03-01" },
          { id: "4", title: "Our stack in 2026, and what we removed", href: "#", category: "Engineering", date: "24 February 2026", dateTime: "2026-02-24" },
        ]}
      />
    </div>
  );
}
