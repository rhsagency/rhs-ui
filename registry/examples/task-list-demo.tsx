"use client";

import { useState, type ReactNode } from "react";

import { TaskList, type TaskSection } from "@rhs-ui/application/task-list";

export default function Demo(): React.JSX.Element {
  const [followed, setFollowed] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-2xl gap-12">
        <Case caption="Every part of the job and where it stands, in words and in a shape. Follow a link: here it is caught with onNavigate instead of leaving the page.">
          <div className="grid gap-3">
            <TaskList
              heading="Business verification"
              sections={VERIFICATION}
              onNavigate={(section, event) => {
                event.preventDefault();
                setFollowed(section.title);
              }}
            />
            <p role="status" className="min-h-5 text-xs text-muted-foreground">
              {followed ? (
                <>
                  Would open <span className="font-medium text-foreground">{followed}</span>
                </>
              ) : (
                "Nothing opened yet."
              )}
            </p>
          </div>
        </Case>

        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] sm:items-start">
          <Case caption="Narrow, as on a phone: the status moves under the title and each row stays a comfortable thumb target.">
            <TaskList heading="Mortgage pack" headingLevel={3} sections={MORTGAGE} />
          </Case>
          <Case caption="Without a heading or a summary: only the list, still a labelled region.">
            <TaskList showSummary={false} sections={MORTGAGE.slice(0, 3)} labels={{ list: "Mortgage pack sections" }} className="sm:max-w-none" />
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const VERIFICATION: readonly TaskSection[] = [
  { id: "company", title: "Company details", href: "#company", status: "completed", hint: "Northwind Trading B.V., KvK 81207345" },
  { id: "people", title: "Directors and owners", href: "#people", status: "in-progress", hint: "2 of 3 people added" },
  { id: "address", title: "Proof of address", href: "#address", status: "needs-attention", hint: "The utility bill is older than 3 months" },
  { id: "bank", title: "Bank account", href: "#bank", status: "not-started", hint: "Takes about five minutes" },
  { id: "vat", title: "VAT and tax details", status: "cannot-start", hint: "Add your directors and owners first" },
  { id: "declaration", title: "Declaration and signature", status: "cannot-start", hint: "Finish the sections above first" },
];

const MORTGAGE: readonly TaskSection[] = [
  { id: "income", title: "Proof of income", href: "#income", status: "completed", hint: "3 payslips uploaded" },
  { id: "identity", title: "Identity documents", href: "#identity", status: "completed" },
  { id: "property", title: "The property", href: "#property", status: "in-progress", hint: "The valuation report is still missing" },
  { id: "submit", title: "Sign and submit", status: "cannot-start", hint: "Complete the property first" },
];
