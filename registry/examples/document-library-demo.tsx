import { DocumentLibrary } from "@rhs-ui/marketing/document-library";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="mb-6 text-xs text-muted-foreground">With search: type &ldquo;spreadsheet&rdquo; or &ldquo;nederlands&rdquo; to narrow the list</p>
      <DocumentLibrary
        searchable
        title="Documents"
        description="Reports, policies and brochures from Kestrel Holdings. Every file is free to download and to share."
        groups={[
          {
            title: "Annual reports",
            description: "Audited by Linden & Marsh. Earlier years are kept for ten years.",
            documents: [
              {
                title: "Annual report 2025",
                description: "The audited financial statements, the board's report and the outlook for 2026.",
                format: "PDF",
                size: "2 MB",
                pages: 84,
                language: "English",
                updated: "2026-03-12",
                href: "#annual-report-2025.pdf",
              },
              {
                title: "Jaarverslag 2025",
                description: "Het volledige jaarverslag, vertaald voor onze Nederlandse aandeelhouders.",
                format: "PDF",
                size: "2.1 MB",
                pages: 86,
                language: "Nederlands",
                updated: "2026-03-12",
                href: "#jaarverslag-2025.pdf",
              },
              {
                title: "Financial statements 2025",
                description: "Every table from the annual report as a spreadsheet, ready for your own analysis.",
                format: "XLSX",
                size: "412 KB",
                language: "English",
                updated: "2026-03-12",
                href: "#financial-statements-2025.xlsx",
              },
              {
                title: "Annual report 2024",
                format: "PDF",
                size: "1.9 MB",
                pages: 78,
                language: "English",
                updated: "2025-03-14",
                href: "#annual-report-2024.pdf",
              },
            ],
          },
          {
            title: "Policies",
            documents: [
              {
                title: "Code of conduct",
                description: "What we expect of every employee, director and supplier.",
                format: "PDF",
                size: "380 KB",
                pages: 12,
                language: "English",
                updated: "2026-01-20",
                href: "#code-of-conduct.pdf",
              },
              {
                title: "Whistleblower procedure",
                description: "How to report a concern, who reads it and how you are protected.",
                format: "PDF",
                size: "190 KB",
                pages: 6,
                language: "English",
                updated: "2025-11-04",
                href: "#whistleblower.pdf",
              },
              {
                title: "Supplier questionnaire",
                description: "The form every new supplier fills in before their first order. Editable.",
                format: "DOCX",
                size: "96 KB",
                pages: 5,
                language: "English",
                updated: "2026-02-09",
                href: "#supplier-questionnaire.docx",
              },
            ],
          },
          {
            title: "Brochures",
            documents: [
              {
                title: "Services overview 2026",
                description: "What we offer, who it is for and what it costs.",
                format: "PDF",
                size: "6.4 MB",
                pages: 16,
                language: "English",
                updated: "2026-04-22",
                href: "#services-2026.pdf",
              },
            ],
          },
        ]}
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">Without search, in a smaller section: a school&rsquo;s documents for parents</p>
      <DocumentLibrary
        headingLevel={3}
        groups={[
          {
            title: "Forms",
            documents: [
              { title: "Absence notification", description: "Fill in and return to the office by 09:00.", format: "DOCX", size: "58 KB", pages: 1, language: "English", href: "#absence.docx" },
              { title: "Permission for school trips", format: "PDF", size: "120 KB", pages: 2, language: "English", href: "#trips.pdf" },
            ],
          },
        ]}
      />
    </div>
  );
}
