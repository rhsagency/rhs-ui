import { BlogGrid } from "@rhs-ui/marketing/blog-grid";

const cover = (fill: string, shape: string) => ({
  src: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='${fill}'/>${shape}</svg>`),
  alt: "",
});

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <BlogGrid
        eyebrow="Journal"
        title="Notes from the studio"
        allPosts={{ label: "All articles", href: "#" }}
        posts={[
          { id: "1", title: "Why we stopped estimating in hours", excerpt: "Six months of shipping in appetites instead of estimates, and what it did to our weeks.", href: "#", category: "Process", date: "2 March 2026", dateTime: "2026-03-02", readingTime: "6 min", image: cover("#d9d6cf", "<circle cx='400' cy='250' r='120' fill='#8d877c'/>") },
          { id: "2", title: "A type scale that survives a redesign", excerpt: "Five sizes, one ratio, and the rule that kept our marketing site and app in step.", href: "#", category: "Design", date: "18 February 2026", dateTime: "2026-02-18", readingTime: "4 min", image: cover("#2f3236", "<rect x='240' y='150' width='320' height='200' rx='24' fill='#6b7078'/>") },
          { id: "3", title: "Shipping on Fridays, safely", excerpt: "Feature flags, a five-minute rollback and the checklist we run before every release.", href: "#", category: "Engineering", date: "4 February 2026", dateTime: "2026-02-04", readingTime: "8 min", image: cover("#e9e7e2", "<path d='M200 380L400 120L600 380Z' fill='#a39d91'/>") },
        ]}
      />
    </div>
  );
}
