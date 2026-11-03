"use client";

import { useId, useState, type ReactNode } from "react";

import { FormSection } from "@rhs-ui/application/form-section";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Switch } from "@rhs-ui/primitives/switch";
import { Textarea } from "@rhs-ui/primitives/textarea";

/** One setting with a switch on the right and a line that explains it. */
function ToggleRow({ title, children, defaultChecked = false }: { title: string; children: ReactNode; defaultChecked?: boolean }): React.JSX.Element {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="grid min-w-0 gap-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {title}
        </label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {children}
        </p>
      </div>
      <Switch id={id} defaultChecked={defaultChecked} aria-describedby={`${id}-help`} className="mt-0.5 shrink-0" />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 grid gap-1">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Workspace settings</h2>
        <p className="text-sm text-muted-foreground">How Northwind Studio looks, who hears about it and who pays for it.</p>
      </header>

      <FormSection
        layout="split"
        title="Workspace profile"
        description="The name and address your team and your guests see. You can change them whenever you like."
        requirement="required"
        footer={
          <>
            <span aria-live="polite" className="mr-auto text-xs text-muted-foreground">
              {saved ? "Profile saved" : "Last saved 2 March"}
            </span>
            <Button size="sm" onClick={() => setSaved(true)}>
              Save profile
            </Button>
          </>
        }
      >
        <FormField described>
          <FormLabel>Workspace name</FormLabel>
          <FormControl>
            <Input defaultValue="Northwind Studio" onChange={() => setSaved(false)} />
          </FormControl>
          <FormDescription>Shown in the sidebar, on invoices and in every email we send for you.</FormDescription>
        </FormField>
        <FormField described>
          <FormLabel>About</FormLabel>
          <FormControl>
            <Textarea rows={3} defaultValue="A six-person studio for brand and web, working with Halcyon, Kestrel and a few others." onChange={() => setSaved(false)} />
          </FormControl>
          <FormDescription>Two sentences are plenty. It appears on your public page.</FormDescription>
        </FormField>
      </FormSection>

      <FormSection layout="split" title="Notifications" description="Choose what is worth an email. Everything else stays in the app." requirement="optional">
        <ToggleRow title="Weekly digest" defaultChecked>
          Monday morning: what moved, what is late and who joined.
        </ToggleRow>
        <ToggleRow title="Mentions and replies" defaultChecked>
          An email when someone writes your name, unless you are already in the app.
        </ToggleRow>
        <ToggleRow title="Product news">Rare, short and never sent more than once a month.</ToggleRow>
      </FormSection>

      <FormSection
        layout="split"
        title="Billing contact"
        description="Invoices and failed payments go here, and nowhere else."
        requirement="required"
        error="Add a billing contact before you invite more people to Northwind Studio."
      >
        <FormField described>
          <FormLabel>Email address</FormLabel>
          <FormControl>
            <Input type="email" placeholder="finance@northwind.example" />
          </FormControl>
          <FormDescription>One address is enough. Use a shared inbox if you can.</FormDescription>
        </FormField>
      </FormSection>

      <FormSection title="Data retention" description="Managed by your workspace owner, so these are read only for you." requirement="optional" disabled>
        <div className="grid gap-2">
          <span className="text-sm font-medium">Keep deleted projects for</span>
          <Select defaultValue="90">
            <SelectTrigger aria-label="Keep deleted projects for" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">One year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ToggleRow title="Delete files with the project" defaultChecked>
          Removes uploads and exports too, not only the project page.
        </ToggleRow>
      </FormSection>
    </div>
  );
}
