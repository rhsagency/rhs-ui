import type { ReactNode } from "react";

import { CapabilityQuestions, type CapabilityQuestion } from "@rhs-ui/marketing/capability-questions";

const QUESTIONS: CapabilityQuestion[] = [
  {
    group: "data",
    question: "Can I import from a spreadsheet?",
    verdict: "yes",
    answer: "Upload a CSV or XLSX file, map the columns once and Halcyon remembers the mapping for next time. Files of up to 50 MB and 200,000 rows work on every plan.",
    href: "#import",
  },
  {
    group: "data",
    question: "Can I export everything?",
    verdict: "yes",
    answer: "Every workspace exports to CSV and JSON from Settings, comments and attachments included, whenever you want. There is no request form and no waiting.",
    href: "#export",
  },
  {
    group: "data",
    question: "Can I keep my data in the EU?",
    verdict: "plan",
    plan: "Business",
    answer: "EU hosting in Frankfurt is part of Business. Moving a workspace across takes one step, and nothing else changes for your team.",
    href: "#eu-hosting",
  },
  {
    group: "data",
    question: "Does it sync with Google Sheets?",
    verdict: "soon",
    answer: "Two-way sync is planned for early 2027. Until then a scheduled CSV export to a Drive folder keeps a sheet current, and the API reads the same data.",
    href: "#sheets",
  },
  {
    group: "security",
    question: "Do you support single sign-on?",
    verdict: "plan",
    plan: "Business",
    answer: "SAML single sign-on works with Okta, Entra ID and Google Workspace, and SCIM keeps the list of people in step. Every plan can sign in with Google or Microsoft.",
    href: "#sso",
  },
  {
    group: "security",
    question: "Can a guest see only one project?",
    verdict: "yes",
    answer: "Invite anyone as a guest to a single project. They see its tasks and files and nothing else, and you can remove them in one click.",
    href: "#guests",
  },
  {
    group: "security",
    question: "Is there an on-premise version?",
    verdict: "no",
    answer: "Halcyon runs in our cloud only. If your policy needs a private network, dedicated hosting on Enterprise gives you an isolated environment of your own.",
    href: "#dedicated",
  },
  {
    group: "security",
    question: "Do you keep an audit log?",
    verdict: "plan",
    plan: "Enterprise",
    answer: "Enterprise keeps a searchable log of every change for two years. On other plans, each project's activity feed shows the last 90 days.",
    href: "#audit",
  },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Eight questions in two topics, all four verdicts, every answer on the page. A not-yet or no answer names what to do instead">
        <CapabilityQuestions
          eyebrow="Before you ask"
          title="Can Halcyon do what you need?"
          description="Straight answers to what sales hears most, including the ones that are not a yes."
          groups={[
            { id: "data", label: "Data and import" },
            { id: "security", label: "Security and access" },
          ]}
          items={QUESTIONS}
          contact={{ text: "Not on the list? We answer every question within one working day.", label: "Ask the team", href: "#contact" }}
        />
      </Example>
      <div className="mx-auto mt-20 max-w-2xl border-t border-border pt-12 sm:mt-24">
        <Example caption="In a narrow column, with no topics and a smaller heading: one column, and the questions sit directly under the heading">
          <CapabilityQuestions headingLevel={3} title="Quick answers" items={[QUESTIONS[0]!, QUESTIONS[6]!]} />
        </Example>
      </div>
    </div>
  );
}
