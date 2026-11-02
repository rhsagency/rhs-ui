"use client";

import { useState } from "react";

import { IconChart, IconEdit, IconLanguage, IconList } from "@rhs-ui/icons";
import { PromptExamples, type PromptExample } from "@rhs-ui/marketing/prompt-examples";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

const TICKETS = [
  { category: "Billing", before: 412, after: 389 },
  { category: "Login and access", before: 188, after: 301 },
  { category: "Integrations", before: 96, after: 118 },
  { category: "Everything else", before: 241, after: 236 },
];

const EXAMPLES: PromptExample[] = [
  {
    id: "summarise",
    label: "Summarise",
    icon: <IconList />,
    prompt: "Summarise the attached 12-page supplier contract for our finance team. Flag anything about payment terms or renewal.",
    answer: (
      <>
        <p>Here is the short version for finance.</p>
        <ul>
          <li>
            <strong>Term:</strong> 24 months from 1 March 2027, renewing every year unless either side gives 90 days&apos; notice.
          </li>
          <li>
            <strong>Payment:</strong> net 45 days from invoice, with 2% a month on late amounts.
          </li>
          <li>
            <strong>Price changes:</strong> capped at inflation plus 2% a year, and only if announced in writing before 1 November.
          </li>
          <li>
            <strong>Worth a second look:</strong> clause 9.3 lets the supplier suspend service after one missed payment, with no time to put it right.
          </li>
        </ul>
      </>
    ),
    note: "Example output, edited for length",
  },
  {
    id: "draft",
    label: "Draft",
    icon: <IconEdit />,
    prompt: "Draft a reply to a customer whose order of three Kestrel chairs arrived with a cracked leg. Warm tone, offer a replacement or a refund, under 120 words.",
    answer: (
      <>
        <p>
          <strong>Subject:</strong> Your Kestrel chairs, and how we will put this right
        </p>
        <p>Hi Anouk,</p>
        <p>I am so sorry the chairs arrived damaged. That is not how we want an order to begin, and the photo you sent makes the problem very clear.</p>
        <p>You can choose how we fix it. We can send a replacement chair this week at no cost, or refund the €189 for that chair to the card you paid with. Either way, there is no need to send the cracked one back.</p>
        <p>Just reply with which you prefer, and I will arrange it today.</p>
        <p>Warm regards, Mila</p>
      </>
    ),
    note: "Example output, edited for length",
  },
  {
    id: "analyse",
    label: "Analyse",
    icon: <IconChart />,
    prompt: "Here are last quarter's support tickets by category. What changed, and what should we look at first?",
    answer: (
      <>
        <p>Tickets rose from 937 to 1,044. Almost all of the change sits in one category.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pr-2 pl-0">Category</TableHead>
              <TableHead className="px-2 text-right">Q2</TableHead>
              <TableHead className="px-2 text-right">Q3</TableHead>
              <TableHead className="pr-0 pl-2 text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TICKETS.map((row) => {
              const change = Math.round(((row.after - row.before) / row.before) * 100);
              return (
                <TableRow key={row.category}>
                  <TableCell className="pr-2 pl-0 font-medium">{row.category}</TableCell>
                  <TableCell className="px-2 text-right tabular-nums">{row.before}</TableCell>
                  <TableCell className="px-2 text-right tabular-nums">{row.after}</TableCell>
                  <TableCell className="pr-0 pl-2 text-right tabular-nums">{`${change > 0 ? "+" : "−"}${Math.abs(change)}%`}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p>
          <strong>Look at login and access first.</strong> It grew by 113 tickets, more than the whole net rise of 107, and the new ones mostly mention single sign-on.
        </p>
      </>
    ),
    note: "Example output, with the figures from your export",
  },
  {
    id: "translate",
    label: "Translate",
    icon: <IconLanguage />,
    prompt: "Translate this onboarding email into German and Dutch. Keep the product names in English.\n\n“Welcome to Kestrel! Your workspace is ready. Invite your team to get started.”",
    answer: (
      <>
        <p>
          <strong>Deutsch</strong>
        </p>
        <p>Willkommen bei Kestrel! Ihr Workspace ist bereit. Laden Sie Ihr Team ein, um loszulegen.</p>
        <p>
          <strong>Nederlands</strong>
        </p>
        <p>Welkom bij Kestrel! Je workspace staat klaar. Nodig je team uit om te beginnen.</p>
      </>
    ),
  },
];

export default function Demo(): React.JSX.Element {
  const [message, setMessage] = useState("");
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">
        Four written examples, one tab each, with arrow keys between them. The panels share one cell, so the section keeps its height when you change tab. Three answers carry a note; the last has none, so none is shown. Try this prompt calls the handler
      </p>
      <PromptExamples
        title="See what it does with a real task"
        description="Four things people ask Kestrel Assistant every day, with the answers it gives. These are written examples, not live output, so nothing here needs an account."
        examples={EXAMPLES}
        onTry={(prompt) => setMessage(`Opened the assistant with: “${prompt.split("\n")[0]?.slice(0, 64)}…”. Demo only: nothing is sent.`)}
      />
      <p role="status" className="mt-8 min-h-6 text-center text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
