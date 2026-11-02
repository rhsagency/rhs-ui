"use client";

import { TrustDocuments, type TrustRequestDetails } from "@rhs-ui/marketing/trust-documents";

/** A stand-in for your own endpoint. The first request for the penetration test summary fails, so the error and the retry can be seen. */
const failures = new Set<string>(["pen-test"]);

async function request(documentId: string, details: TrustRequestDetails): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (failures.delete(documentId)) throw new Error(`The request for ${documentId} from ${details.company} did not go through`);
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Public files download, the rest open a request; the penetration test summary fails once, to show the retry</p>
      <TrustDocuments
        eyebrow="Trust center"
        title="The documents your security review asks for"
        description="Everything we are asked for, in one place, with the date it applies to. Public files download straight away; the rest we share under NDA within one business day."
        contact={{ label: "security@northwind.example", href: "mailto:security@northwind.example" }}
        onRequest={request}
        documents={[
          {
            id: "soc2",
            title: "SOC 2 Type II report",
            description: "An independent audit of our security, availability and confidentiality controls over twelve months.",
            format: "PDF",
            size: "3.1 MB",
            updatedAt: "2026-06-30",
            access: "request",
          },
          {
            id: "iso27001",
            title: "ISO 27001 certificate",
            description: "The certificate and its scope statement, issued by BSI and valid until March 2028.",
            format: "PDF",
            size: "412 KB",
            updatedAt: "2026-02-14",
            access: "public",
            href: "#iso-27001.pdf",
          },
          {
            id: "pen-test",
            title: "Penetration test summary",
            description: "The executive summary of the latest external test by Cobalt Reef Security, with what was found and fixed.",
            format: "PDF",
            size: "1.2 MB",
            updatedAt: "2026-09-08",
            access: "request",
          },
          {
            id: "whitepaper",
            title: "Security whitepaper",
            description: "How data is encrypted, who can reach it and how we respond when something goes wrong.",
            format: "PDF",
            size: "2.6 MB",
            updatedAt: "2026-04-21",
            access: "public",
            href: "#security-whitepaper.pdf",
          },
          {
            id: "dpa",
            title: "Data processing addendum",
            description: "Our standard DPA with the EU standard contractual clauses, ready to sign.",
            format: "PDF",
            size: "286 KB",
            updatedAt: "2026-01-12",
            access: "public",
            href: "#dpa.pdf",
          },
          {
            id: "bcp",
            title: "Business continuity plan",
            description: "Recovery objectives, how we fail over, and the results of the last disaster recovery test.",
            format: "PDF",
            size: "1.8 MB",
            updatedAt: "2026-07-19",
            access: "request",
          },
          {
            id: "caiq",
            title: "Security questionnaire (CAIQ)",
            description: "Our answers to the Cloud Security Alliance questionnaire, as a spreadsheet you can paste into your own.",
            format: "XLSX",
            size: "540 KB",
            updatedAt: "2026-05-30",
            access: "request",
          },
        ]}
      />
    </div>
  );
}
