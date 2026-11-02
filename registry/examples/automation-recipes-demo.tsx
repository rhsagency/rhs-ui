"use client";

import { useState, type ReactNode } from "react";

import { AutomationRecipes, type AutomationRecipe } from "@rhs-ui/marketing/automation-recipes";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const RECIPES: readonly AutomationRecipe[] = [
  {
    id: "big-deal-slack",
    group: "sales",
    outcome: "Tell the team in Slack when a big deal is won",
    trigger: { app: "Halcyon", event: "Deal won over €10,000" },
    actions: [{ app: "Slack", action: "Post to #wins" }],
  },
  {
    id: "lead-sheet",
    group: "sales",
    outcome: "Log every new lead in a spreadsheet",
    trigger: { app: "Halcyon", event: "New lead" },
    actions: [
      { app: "Google Sheets", action: "Add a row" },
      { app: "Slack", action: "Notify the owner" },
    ],
  },
  {
    id: "reply-task",
    group: "sales",
    outcome: "Create a follow-up task when a lead replies",
    trigger: { app: "Gmail", event: "Reply from a lead" },
    actions: [
      { app: "Halcyon", action: "Create a task" },
      { app: "Halcyon", action: "Move to Contacted" },
    ],
  },
  {
    id: "call-notes",
    group: "sales",
    outcome: "File the notes of a call on the deal and tell the team",
    trigger: { app: "Zoom", event: "Call ended" },
    actions: [
      { app: "Notion", action: "Create a page" },
      { app: "Halcyon", action: "Attach to the deal" },
      { app: "Slack", action: "Post a summary" },
    ],
  },
  {
    id: "urgent-page",
    group: "support",
    outcome: "Page the on-call engineer for an urgent ticket",
    trigger: { app: "Halcyon", event: "Ticket marked urgent" },
    actions: [
      { app: "PagerDuty", action: "Create an incident" },
      { app: "Slack", action: "Post to #support-alerts" },
    ],
  },
  {
    id: "survey",
    group: "support",
    outcome: "Ask for a rating when a ticket is solved",
    trigger: { app: "Halcyon", event: "Ticket solved" },
    actions: [{ app: "Gmail", action: "Send a one-question survey" }],
  },
  {
    id: "low-rating",
    group: "support",
    outcome: "Reopen a ticket when the rating is low",
    trigger: { app: "Typeform", event: "Rating below 3" },
    actions: [
      { app: "Halcyon", action: "Reopen the ticket" },
      { app: "Slack", action: "Notify the team lead" },
    ],
  },
  {
    id: "invoice-on-win",
    group: "finance",
    outcome: "Draft an invoice the moment a deal is won",
    trigger: { app: "Halcyon", event: "Deal won" },
    actions: [
      { app: "Ledgerly", action: "Create a draft invoice" },
      { app: "Gmail", action: "Email the finance team" },
    ],
  },
  {
    id: "chase-unpaid",
    group: "finance",
    outcome: "Remind a customer when an invoice is a week overdue",
    trigger: { app: "Ledgerly", event: "Invoice 7 days overdue" },
    actions: [
      { app: "Gmail", action: "Send a reminder" },
      { app: "Halcyon", action: "Add a note to the account" },
    ],
  },
  {
    id: "mark-paid",
    group: "finance",
    outcome: "Mark the deal as paid when the money arrives",
    trigger: { app: "Stripe", event: "Payment received" },
    actions: [{ app: "Halcyon", action: "Update the deal" }],
  },
];

export default function Demo(): React.JSX.Element {
  const [added, setAdded] = useState<AutomationRecipe | null>(null);
  const [addedShop, setAddedShop] = useState<AutomationRecipe | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Ten recipes under three tabs by team. Each row says what it does for you, then the trigger, an arrow and up to three actions. Use one and the block tells you which">
        <AutomationRecipes
          eyebrow="Automations"
          title="Start from a recipe"
          description="Pick one that sounds like your week. It is copied into your workspace, switched off, so you can read it and change it before it runs."
          recipes={RECIPES}
          groups={[
            { id: "sales", label: "Sales" },
            { id: "support", label: "Support" },
            { id: "finance", label: "Finance" },
          ]}
          onUse={(_id, recipe) => setAdded(recipe)}
        />
        <p role="status" aria-live="polite" className="mt-5 min-h-5 text-sm text-muted-foreground">
          {added ? `Added “${added.outcome}” to your workspace, switched off.` : ""}
        </p>
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="Three recipes without tabs in a narrow column: the chips wrap, the arrow turns down and the button takes the full width">
          <AutomationRecipes
            headingLevel={3}
            title="Popular with shops"
            recipes={[
              {
                id: "shop-order-pick",
                outcome: "Send a paid order to the warehouse",
                trigger: { app: "Northwind", event: "Order paid" },
                actions: [
                  { app: "Kestrel Fulfilment", action: "Create a pick list" },
                  { app: "Slack", action: "Post to #warehouse" },
                ],
              },
              {
                id: "shop-low-stock",
                outcome: "Email the buyer when stock runs low",
                trigger: { app: "Northwind", event: "Stock below 5" },
                actions: [{ app: "Gmail", action: "Send a restock request" }],
              },
              {
                id: "shop-review",
                outcome: "Ask for a review a week after delivery",
                trigger: { app: "Kestrel Fulfilment", event: "Parcel delivered" },
                actions: [
                  { app: "Gmail", action: "Wait 7 days, then send a review request" },
                ],
              },
            ]}
            onUse={(_id, recipe) => setAddedShop(recipe)}
          />
          <p role="status" aria-live="polite" className="mt-5 min-h-5 text-sm text-muted-foreground">
            {addedShop ? `Added “${addedShop.outcome}”, switched off.` : ""}
          </p>
        </Example>
      </div>
    </div>
  );
}
