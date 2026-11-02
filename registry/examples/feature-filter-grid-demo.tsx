import type { ReactNode } from "react";

import {
  IconAtSign,
  IconBug,
  IconCalendar,
  IconChartBar,
  IconCode,
  IconCopy,
  IconDashboard,
  IconDownload,
  IconEye,
  IconFileText,
  IconFingerprint,
  IconGitBranch,
  IconHistory,
  IconInbox,
  IconKey,
  IconLayout,
  IconLink,
  IconMail,
  IconMap,
  IconMessages,
  IconNodes,
  IconRepeat,
  IconRocket,
  IconRuler,
  IconServer,
  IconShield,
  IconSliders,
  IconTimer,
  IconUserCheck,
  IconUserPlus,
  IconWallet,
  IconWorkflow,
} from "@rhs-ui/icons";
import { FeatureFilterGrid, type FilterFeature } from "@rhs-ui/marketing/feature-filter-grid";

/** Twenty-four features in four areas, none in more than one: the chips add up to the whole. */
const AREAS: FilterFeature[] = [
  { id: "shared-inboxes", icon: <IconInbox />, title: "Shared inboxes", description: "Every customer email lands in one place with one owner, so nothing is answered twice.", groups: ["collaboration"], href: "#shared-inboxes" },
  { id: "threads", icon: <IconMessages />, title: "Comment threads", description: "Discuss a task where it lives. The thread stays with the work, not in a chat nobody can find.", groups: ["collaboration"], href: "#threads" },
  { id: "mentions", icon: <IconAtSign />, title: "Mentions and handoffs", description: "Tag a teammate and hand a task over with a note. They see exactly what changed.", groups: ["collaboration"], href: "#mentions" },
  { id: "guests", icon: <IconUserPlus />, title: "Guest access", description: "Invite a client to one project. They see their work and nothing else.", groups: ["collaboration"], href: "#guests", tag: "New" },
  { id: "views", icon: <IconLayout />, title: "Shared views", description: "Save a filter as a view and share it, so the whole team looks at the same list.", groups: ["collaboration"], href: "#views" },
  { id: "calendar", icon: <IconCalendar />, title: "Team calendar", description: "See who is out, what is due and where the week is tight before you plan it.", groups: ["collaboration"], href: "#calendar" },
  { id: "docs", icon: <IconFileText />, title: "Live documents", description: "Write specs and notes beside the tasks they describe, with every change tracked.", groups: ["collaboration"], href: "#docs", tag: "Beta" },

  { id: "rules", icon: <IconWorkflow />, title: "Rules", description: "If a request mentions a refund, tag it, assign it and start the clock. No code.", groups: ["automation"], href: "#rules" },
  { id: "templates", icon: <IconCopy />, title: "Project templates", description: "Start the next launch from the last one, with its tasks, owners and dates.", groups: ["automation"], href: "#templates" },
  { id: "recurring", icon: <IconRepeat />, title: "Recurring work", description: "Weekly reports, monthly invoices and quarterly reviews appear on time, every time.", groups: ["automation"], href: "#recurring" },
  { id: "auto-assign", icon: <IconUserCheck />, title: "Auto-assign", description: "Route new work by skill, load or round robin, and skip anyone who is away.", groups: ["automation"], href: "#auto-assign" },
  { id: "webhooks", icon: <IconNodes />, title: "Webhooks", description: "Send events to your own systems the moment something changes.", groups: ["automation"], href: "#webhooks" },
  { id: "api", icon: <IconCode />, title: "API access", description: "Read and write everything the app can, with scoped keys and clear rate limits.", groups: ["automation"], href: "#api", tag: "Business" },

  { id: "sso", icon: <IconKey />, title: "Single sign-on", description: "Sign in with Okta, Entra ID or Google Workspace, and let SCIM manage the rest.", groups: ["security"], href: "#sso", tag: "Business" },
  { id: "roles", icon: <IconShield />, title: "Roles and permissions", description: "Decide who can see, edit and delete per project, without a spreadsheet of exceptions.", groups: ["security"], href: "#roles" },
  { id: "audit", icon: <IconHistory />, title: "Audit log", description: "A searchable record of every change, who made it and when, kept for two years.", groups: ["security"], href: "#audit", tag: "Business" },
  { id: "two-step", icon: <IconFingerprint />, title: "Two-step verification", description: "Require an authenticator app or a passkey for everyone, or only for admins.", groups: ["security"], href: "#two-step" },
  { id: "eu-hosting", icon: <IconServer />, title: "EU data residency", description: "Keep workspace data in Frankfurt, with backups that never leave the region.", groups: ["security"], href: "#eu-hosting", tag: "Business" },

  { id: "dashboards", icon: <IconDashboard />, title: "Dashboards", description: "Build a view of what matters in minutes and pin it where the team will see it.", groups: ["reporting"], href: "#dashboards" },
  { id: "workload", icon: <IconChartBar />, title: "Workload view", description: "See who is overloaded this week and move work before anyone burns out.", groups: ["reporting"], href: "#workload" },
  { id: "time", icon: <IconTimer />, title: "Time reports", description: "Compare estimates with actuals per project and see where the hours really went.", groups: ["reporting"], href: "#time" },
  { id: "exports", icon: <IconDownload />, title: "Exports", description: "Take everything out as CSV or JSON whenever you like, without asking us.", groups: ["reporting"], href: "#exports" },
  { id: "digests", icon: <IconMail />, title: "Scheduled digests", description: "A Monday summary in everyone's inbox, so the status meeting can be shorter.", groups: ["reporting"], href: "#digests" },
  { id: "fields", icon: <IconSliders />, title: "Custom fields", description: "Add the fields your work needs and report on them like any other.", groups: ["reporting"], href: "#fields" },
];

/** Nine features for three roles. Several belong to two, so a chip can show more than its neighbours add up to. */
const ROLES: FilterFeature[] = [
  { id: "roadmap", icon: <IconMap />, title: "Roadmap", description: "Put the next two quarters on one page and share it with the board.", groups: ["founders"], href: "#roadmap" },
  { id: "updates", icon: <IconMail />, title: "Investor updates", description: "Turn a month of work into a one-page update, built from what actually shipped.", groups: ["founders"], href: "#updates" },
  { id: "budget", icon: <IconWallet />, title: "Budget tracking", description: "Compare spend with plan per project, in the currency you pay in.", groups: ["founders"], href: "#budget" },
  { id: "reviews", icon: <IconEye />, title: "Design reviews", description: "Pin feedback to the exact spot in a file, and close it when it is fixed.", groups: ["designers"], href: "#reviews" },
  { id: "history", icon: <IconGitBranch />, title: "Version history", description: "Every revision kept and named, so you can go back to Tuesday's version.", groups: ["designers", "engineers"], href: "#history" },
  { id: "handoff", icon: <IconRuler />, title: "Handoff specs", description: "Spacing, type and tokens the way engineers need them, generated from the file.", groups: ["designers", "engineers"], href: "#handoff", tag: "New" },
  { id: "issues", icon: <IconBug />, title: "Issue tracker", description: "Bugs, tasks and ideas in one list, linked to the commits that fix them.", groups: ["engineers"], href: "#issues" },
  { id: "notes", icon: <IconRocket />, title: "Release notes", description: "Draft notes from merged work and publish them to your changelog.", groups: ["engineers", "founders"], href: "#notes" },
  { id: "previews", icon: <IconLink />, title: "Deploy previews", description: "A link for every change, so reviewers can click instead of imagine.", groups: ["engineers", "designers"], href: "#previews" },
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
      <Example caption="Twenty-four features in four areas: choose a chip and the grid narrows in place, says how many are shown and settles to its new height instead of jumping. The Mobile group has no features, so it is not offered">
        <FeatureFilterGrid
          eyebrow="Everything in Halcyon"
          title="Twenty-four ways Halcyon takes work off your plate"
          description="Pick an area to see only what matters to you. It is all in the plan you start on, except where a tag says otherwise."
          label="Filter features by area"
          groups={[
            { id: "collaboration", label: "Collaboration" },
            { id: "automation", label: "Automation" },
            { id: "security", label: "Security" },
            { id: "reporting", label: "Reporting" },
            { id: "mobile", label: "Mobile" },
          ]}
          features={AREAS}
        />
      </Example>
      <div className="mt-20 border-t border-border pt-12 sm:mt-24">
        <Example caption="The same block as a pitch to roles: one feature can sit under two chips, so the counts add up to more than nine, and Designers is chosen first">
          <FeatureFilterGrid
            headingLevel={3}
            title="One product, three jobs"
            description="Kestrel is the same app for everyone on the team. Choose your role to see the parts you will use every day."
            label="Filter features by role"
            defaultGroup="designers"
            groups={[
              { id: "founders", label: "Founders" },
              { id: "designers", label: "Designers" },
              { id: "engineers", label: "Engineers" },
            ]}
            features={ROLES}
          />
        </Example>
      </div>
    </div>
  );
}
