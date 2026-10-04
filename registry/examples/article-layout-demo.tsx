import { ArticleLayout } from "@rhs-ui/marketing/article-layout";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ArticleLayout
        category="Case study"
        title="How a twelve-person bakery doubled its online orders"
        lede="De Korenschoof moved its ordering from phone calls to a simple shop, and kept the warmth that made people call in the first place."
        author={{ name: "Femke Bos", role: "Product designer" }}
        date={{ label: "9 March 2026", dateTime: "2026-03-09" }}
        readingTime="7 min read"
      >
        <p>Every morning at six, the phone at De Korenschoof started ringing. Regulars ordered their loaves for the weekend, and the bakers wrote each order on a paper slip.</p>
        <h3>Start with the slip</h3>
        <p>We did not start with a shop. We started with the paper slip, because it already held everything that mattered: <strong>name, bread, day, and a note</strong>.</p>
        <blockquote>The best brief was taped to the wall next to the oven.</blockquote>
        <ul>
          <li>Orders up 104% in the first quarter</li>
          <li>Phone time down from two hours to twenty minutes a day</li>
        </ul>
        <p>The phone still rings. Now it is mostly people saying thank you.</p>
      </ArticleLayout>
    </div>
  );
}
