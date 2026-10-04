import { AiSources } from "@rhs-ui/application/ai-sources";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <p className="mb-4 text-sm leading-relaxed">Webhooks retry up to eight times over 24 hours [1], and each request is signed with your endpoint secret [2]. Events can arrive out of order [3].</p>
      <AiSources
        sources={[
          { id: "1", title: "Retries and backoff", href: "#", origin: "docs.example.com", excerpt: "Failed deliveries are retried up to 8 times with exponential backoff." },
          { id: "2", title: "Verifying signatures", href: "#", origin: "docs.example.com", excerpt: "Every request carries a signature header computed with your secret." },
          { id: "3", title: "Event ordering", href: "#", origin: "Engineering handbook.pdf", excerpt: "Do not rely on delivery order; use the created timestamp." },
        ]}
      />
    </div>
  );
}
