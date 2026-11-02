import type { ReactNode } from "react";

import { ExtensionPoints } from "@rhs-ui/marketing/extension-points";

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
      <Example caption="Five ways to bend a product, from settings to code: a key says what each level takes, and the step marker grows by one bar on every row">
        <ExtensionPoints
          eyebrow="Extending Halcyon"
          title="Bend it to fit, without forking it"
          description="Start with settings, add a rule when you need one, and write code only where nothing else will do. Every step up the ladder keeps what you built below it."
          levels={[
            { id: "no-code", label: "No-code", description: "Change it from the settings. Anyone on the team can." },
            { id: "low-code", label: "Low-code", description: "Write a rule or a formula. A spreadsheet habit is enough." },
            { id: "code", label: "Code", description: "Build against the API or ship a plugin. An engineer's afternoon." },
          ]}
          points={[
            {
              id: "fields",
              name: "Custom fields",
              level: "no-code",
              description: "Add the fields, statuses and views your team already uses, on any record, without asking anyone.",
              examples: ["Add a field", "Rename a stage", "Require a value"],
              href: "#fields",
            },
            {
              id: "rules",
              name: "Automation rules",
              level: "low-code",
              description: "Describe what should happen when a record changes. Halcyon assigns it, tags it, notifies someone or moves it on.",
              examples: ["Assign by region", "Escalate after 24 hours", "Tag VIP customers"],
              href: "#rules",
            },
            {
              id: "webhooks",
              name: "Webhooks",
              level: "low-code",
              description: "Get a signed message the moment anything changes, and send it wherever your team already works.",
              examples: ["Send to Slack", "Update a spreadsheet", "Start a Zapier flow"],
              href: "#webhooks",
            },
            {
              id: "plugins",
              name: "Plugins",
              level: "code",
              description: "Add your own screens, record types and actions inside Halcyon, written in React and reviewed in minutes.",
              examples: ["Custom sidebar panel", "Own record type", "Branded checkout"],
              href: "#plugins",
              linkLabel: "Plugin docs",
            },
            {
              id: "api",
              name: "REST and GraphQL API",
              level: "code",
              description: "Everything the app does, you can do with a token: read, write, import and export, at 600 requests a minute.",
              examples: ["Bulk import", "Sync with your ERP", "Build your own reports"],
              href: "#api",
              linkLabel: "API reference",
            },
          ]}
          footnote="Everything you build is yours. Export your fields, rules and plugins as plain files whenever you like."
        />
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="A smaller ladder with two levels and no key, in a narrow column: the link drops under the chips and the marker has two bars">
          <ExtensionPoints
            headingLevel={3}
            title="Make the checkout yours"
            levels={[
              { id: "settings", label: "Settings" },
              { id: "code", label: "Code" },
            ]}
            points={[
              { id: "branding", name: "Branding", level: "settings", description: "Your logo, your colours, the order of the steps and a field for the courier.", examples: ["Upload a logo", "Reorder steps"], href: "#branding" },
              { id: "checkout-api", name: "Checkout API", level: "code", description: "Replace any step with a screen of your own.", examples: ["Own address form", "Gift messages"], href: "#checkout-api" },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
