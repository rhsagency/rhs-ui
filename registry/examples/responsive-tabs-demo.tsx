"use client";

import { useId, useState, type ReactNode } from "react";

import { IconBell, IconCreditCard, IconPuzzle, IconShield, IconUser } from "@rhs-ui/icons";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { ResponsiveTabs, type ResponsiveTab } from "@rhs-ui/primitives/responsive-tabs";
import { TabsContent } from "@rhs-ui/primitives/tabs";

const SECTIONS: readonly ResponsiveTab[] = [
  { value: "profile", label: "Profile", icon: <IconUser /> },
  { value: "notifications", label: "Notifications", icon: <IconBell />, count: 3 },
  { value: "security", label: "Security", icon: <IconShield /> },
  { value: "billing", label: "Billing", icon: <IconCreditCard /> },
  { value: "integrations", label: "Integrations", icon: <IconPuzzle />, count: 12 },
];

const USAGE: readonly ResponsiveTab[] = [
  { value: "overview", label: "Overview" },
  { value: "usage", label: "Usage" },
  { value: "invoices", label: "Invoices" },
];

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Panel({ title, text, children }: { title: string; text: string; children?: ReactNode }): React.JSX.Element {
  return (
    <div className="grid gap-4">
      <div>
        <h3 className="text-sm font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
      {children}
    </div>
  );
}

function NameField(): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Display name</Label>
      <Input id={id} defaultValue="Mara Okafor" className="max-w-xs" />
    </div>
  );
}

function SettingsPanels(): React.JSX.Element {
  return (
    <>
      <TabsContent value="profile" className="pt-1">
        <Panel title="Profile" text="How your name and photo appear to the rest of the Kestrel team.">
          <NameField />
        </Panel>
      </TabsContent>
      <TabsContent value="notifications" className="pt-1">
        <Panel title="Notifications" text="Three unread: the March receipt, a new sign-in from Lisbon and the weekly digest." />
      </TabsContent>
      <TabsContent value="security" className="pt-1">
        <Panel title="Security" text="Two-step verification is on. Your last sign-in was from Lisbon, two hours ago." />
      </TabsContent>
      <TabsContent value="billing" className="pt-1">
        <Panel title="Billing" text="Studio plan, billed yearly. The next invoice is on 14 March for €468.00." />
      </TabsContent>
      <TabsContent value="integrations" className="pt-1">
        <Panel title="Integrations" text="Twelve apps are connected to the Northwind workspace. Slack was added on Monday." />
      </TabsContent>
    </>
  );
}

function Settings(): React.JSX.Element {
  const [value, setValue] = useState("profile");
  return (
    <ResponsiveTabs label="Account settings" tabs={SECTIONS} value={value} onValueChange={setValue}>
      <SettingsPanels />
    </ResponsiveTabs>
  );
}

function Resizable(): React.JSX.Element {
  return (
    <div className="max-w-full min-w-[15rem] resize-x overflow-hidden rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs max-sm:resize-none sm:p-5" style={{ width: "40rem" }}>
      <Settings />
    </div>
  );
}

function SidePanel(): React.JSX.Element {
  return (
    <div className="w-full max-w-[18rem] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <Settings />
    </div>
  );
}

function UsagePanels(): React.JSX.Element {
  return (
    <>
      <TabsContent value="overview" className="pt-1">
        <Panel title="Overview" text="48,210 requests this month, 12% under your plan." />
      </TabsContent>
      <TabsContent value="usage" className="pt-1">
        <Panel title="Usage" text="Peak was 1,904 requests an hour on Tuesday at 14:00." />
      </TabsContent>
      <TabsContent value="invoices" className="pt-1">
        <Panel title="Invoices" text="Twelve invoices, the latest paid on 1 March." />
      </TabsContent>
    </>
  );
}

function UsagePills(): React.JSX.Element {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <ResponsiveTabs label="Usage" tabs={USAGE} variant="pill" defaultValue="usage">
        <UsagePanels />
      </ResponsiveTabs>
    </div>
  );
}

function Breakpoint(): React.JSX.Element {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <ResponsiveTabs label="Usage, fixed breakpoint" tabs={USAGE} breakpoint={480} defaultValue="usage">
        <UsagePanels />
      </ResponsiveTabs>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Five sections in a wide box are tabs. On a desktop, change the name and drag the corner narrower: the labels stop fitting, it becomes a select, and the panel keeps what you typed. On a phone the box is narrow already, so it is the select.">
          <Resizable />
        </Example>
      </div>

      <Example caption="The same tabs in an 18rem side panel: one select, showing the current icon and label.">
        <SidePanel />
      </Example>

      <Example caption="Three short pill tabs fit anywhere, even on a phone, so they stay tabs.">
        <UsagePills />
      </Example>

      <Example caption="Or decide yourself: with breakpoint={480} anything in a box narrower than 480px is a select, whatever the labels.">
        <Breakpoint />
      </Example>
    </div>
  );
}
