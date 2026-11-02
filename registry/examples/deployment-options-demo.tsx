import type { ReactNode } from "react";

import { DeploymentOptions } from "@rhs-ui/marketing/deployment-options";

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
      <Example caption="Three ways to run Halcyon: the same five facts in every card, so each row lines up across them. One card is recommended, and no price appears">
        <DeploymentOptions
          eyebrow="How you run it"
          title="Choose where Halcyon runs"
          description="Pick the one that fits how your team works and what your security policy says. You can move between them later."
          options={[
            {
              id: "cloud",
              name: "Cloud",
              bestFor: "teams that want to be live this week",
              recommended: true,
              facts: [
                { label: "Runs on", value: "Halcyon Cloud, managed by us" },
                { label: "Data lives", value: "Our EU or US regions, your choice" },
                { label: "You manage", value: "People and settings, nothing else" },
                { label: "Updates", value: "Automatic, every week" },
                { label: "Support", value: "Chat and email, around the clock" },
              ],
              cta: { label: "Start in the cloud", href: "#cloud" },
            },
            {
              id: "self-hosted",
              name: "Self-hosted",
              bestFor: "organisations with strict network rules",
              facts: [
                { label: "Runs on", value: "Your servers or your own cloud account" },
                { label: "Data lives", value: "Inside your own network" },
                { label: "You manage", value: "Servers, backups and upgrades" },
                { label: "Updates", value: "When you choose, from monthly releases" },
                { label: "Support", value: "Business hours, with a named engineer" },
              ],
              cta: { label: "Talk to an engineer", href: "#self-hosted" },
            },
            {
              id: "hybrid",
              name: "Hybrid",
              bestFor: "teams with records that must stay put",
              facts: [
                { label: "Runs on", value: "Our cloud, plus a connector in yours" },
                { label: "Data lives", value: "Sensitive records stay with you" },
                { label: "You manage", value: "The connector and its network access" },
                { label: "Updates", value: "Automatic, connector monthly" },
                { label: "Support", value: "Chat and email, plus a named engineer" },
              ],
              cta: { label: "Plan a hybrid setup", href: "#hybrid" },
            },
          ]}
        />
      </Example>
      <div className="mx-auto mt-20 max-w-4xl border-t border-border pt-12 sm:mt-24">
        <Example caption="The same block for how a studio works with you, with other facts: two cards side by side, and the heading centred">
          <DeploymentOptions
            align="center"
            headingLevel={3}
            title="How we can work together"
            options={[
              {
                id: "project",
                name: "Project",
                bestFor: "a launch with a date and a clear scope",
                facts: [
                  { label: "Scope", value: "A defined set of pages or features" },
                  { label: "Team", value: "A designer, a developer and a producer" },
                  { label: "You provide", value: "One decision-maker and an hour a week" },
                  { label: "Rhythm", value: "Weekly demo, fixed milestones" },
                  { label: "Ends", value: "When the scope is delivered" },
                ],
                cta: { label: "Scope a project", href: "#project" },
              },
              {
                id: "retainer",
                name: "Retainer",
                bestFor: "steady work, month after month",
                recommended: true,
                facts: [
                  { label: "Scope", value: "A monthly block of hours, used as you need them" },
                  { label: "Team", value: "The same two people, every month" },
                  { label: "You provide", value: "A short brief at the start of each month" },
                  { label: "Rhythm", value: "Fortnightly planning, monthly review" },
                  { label: "Ends", value: "With 30 days' notice" },
                ],
                cta: { label: "Start a retainer", href: "#retainer" },
              },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
