import { ArticleMeta } from "@rhs-ui/primitives/article-meta";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="text-3xl font-medium tracking-[-.04em]">Why quiet software wins</h2>
      <ArticleMeta className="mt-4" author="Noor Bakker" authorHref="#author" date="2026-10-04" dateLabel="4 October 2026" readingTime={6} category="Product" categoryHref="#product" />
    </div>
  );
}
