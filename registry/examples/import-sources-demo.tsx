import type { ReactNode } from "react";

import { ImportSources } from "@rhs-ui/marketing/import-sources";

/** A made-up mark for a made-up tool, drawn in the icon hand and in the current colour. Pass your own logos, where you have the right to show them. */
function Mark({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Eight tools to import from and a dashed tile for a CSV; each tile is one link to its guide</p>
      <ImportSources
        eyebrow="Switching"
        title="Bring your data with you"
        description="Moving is the part everyone dreads. Pick the tool you use today and the guide shows what comes across, what does not and how long to set aside."
        csv={{ label: "Upload a CSV", description: "Anything that can export a spreadsheet works. Upload it, match the columns to ours and check a preview before anything is saved.", href: "#csv" }}
        help={{ label: "Ask us to build it", href: "#request-importer" }}
        sources={[
          {
            id: "brightdesk",
            name: "Brightdesk",
            mark: (
              <Mark>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
              </Mark>
            ),
            imports: ["Tickets", "Contacts", "Macros", "Attachments"],
            estimate: "About 20 minutes",
            guideHref: "#brightdesk",
          },
          {
            id: "pipeful",
            name: "Pipeful",
            mark: (
              <Mark>
                <path d="M4 5h16l-6 7v6l-4 2v-8z" />
              </Mark>
            ),
            imports: ["Contacts", "Companies", "Deals", "Notes"],
            estimate: "About 10 minutes",
            guideHref: "#pipeful",
          },
          {
            id: "copperline",
            name: "Copperline",
            mark: (
              <Mark>
                <circle cx="9" cy="12" r="5" />
                <circle cx="15" cy="12" r="5" />
              </Mark>
            ),
            imports: ["Contacts", "Deals", "Activity history"],
            estimate: "About 15 minutes",
            guideHref: "#copperline",
          },
          {
            id: "ledgerly",
            name: "Ledgerly",
            mark: (
              <Mark>
                <path d="M5 20V10M12 20V4M19 20v-7" />
              </Mark>
            ),
            imports: ["Customers", "Invoices", "Payments"],
            estimate: "Under 10 minutes",
            guideHref: "#ledgerly",
          },
          {
            id: "fieldnote",
            name: "Fieldnote",
            mark: (
              <Mark>
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M8 9h8M8 13h5" />
              </Mark>
            ),
            imports: ["Notes", "Tags", "Attachments"],
            estimate: "About 30 minutes",
            guideHref: "#fieldnote",
          },
          {
            id: "stackbase",
            name: "Stackbase",
            mark: (
              <Mark>
                <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />
              </Mark>
            ),
            imports: ["Projects", "Tasks", "Comments", "Files"],
            estimate: "About 1 hour",
            guideHref: "#stackbase",
          },
          {
            id: "tallyhub",
            name: "Tallyhub",
            mark: (
              <Mark>
                <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
              </Mark>
            ),
            imports: ["Contacts", "Lists"],
            estimate: "Under 5 minutes",
            guideHref: "#tallyhub",
          },
          {
            id: "northbound",
            name: "Northbound",
            mark: (
              <Mark>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 16V8M8.5 11.5L12 8l3.5 3.5" />
              </Mark>
            ),
            imports: ["Contacts", "Companies", "Deals", "Emails", "Calendar events"],
            estimate: "About 45 minutes",
            guideHref: "#northbound",
          },
        ]}
      />

      <p className="mt-20 mb-8 text-xs text-muted-foreground">No marks, in a narrow column: each tile shows the first letter of the tool, one tile per row</p>
      <div className="max-w-md">
        <ImportSources
          headingLevel={3}
          title="Import from"
          sources={[
            { id: "a", name: "Brightdesk", imports: ["Tickets", "Contacts"], estimate: "About 20 minutes", guideHref: "#a" },
            { id: "b", name: "Pipeful", imports: ["Contacts", "Deals"], estimate: "About 10 minutes", guideHref: "#b" },
            { id: "c", name: "Tallyhub", imports: ["Contacts"], estimate: "Under 5 minutes", guideHref: "#c" },
          ]}
        />
      </div>
    </div>
  );
}
