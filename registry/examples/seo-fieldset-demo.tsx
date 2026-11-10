"use client";

import { useState, type ReactNode } from "react";

import { SeoFieldset, type SeoValue } from "@rhs-ui/application/seo-fieldset";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

export default function Demo(): React.JSX.Element {
  const [post, setPost] = useState<SeoValue>({
    title: "How we price a website project | Northwind Studio",
    description: "We price a site by what it has to do, not by pages. Here is how scope, content, integrations and support shape the quote, with real ranges from last year.",
    slug: "journal/how-we-price-a-website",
  });
  const [draft, setDraft] = useState<SeoValue>({
    title: "Our complete, honest, step by step guide to pricing a custom website project in 2026",
    description: "",
    slug: "journal/pricing-guide",
  });

  return (
    <div className="grid w-full max-w-5xl gap-x-10 gap-y-9 lg:grid-cols-2 lg:items-start">
      <Example caption="Try it: edit the title and the description and watch the meter and the preview. The slug has its own field here.">
        <div className={card}>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Search appearance</h2>
          <SeoFieldset
            baseUrl="https://northwind.example"
            siteName="Northwind Studio"
            value={post}
            onValueChange={setPost}
            editSlug
            fallbackTitle="How we price a website project"
            fallbackDescription="Pricing a website starts with what it has to do. Here is how we think about scope, content, integrations and support."
          />
        </div>
      </Example>

      <Example caption="A title that is too long is cut where the limit says, and an empty description shows the page's own text in grey.">
        <div className={card}>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Search appearance</h2>
          <SeoFieldset
            baseUrl="https://northwind.example"
            siteName="Northwind Studio"
            value={draft}
            onValueChange={setDraft}
            fallbackTitle="Pricing guide"
            fallbackDescription="Every project is different, but the cost always comes back to four things: scope, content, integrations and support."
          />
        </div>
      </Example>
    </div>
  );
}
