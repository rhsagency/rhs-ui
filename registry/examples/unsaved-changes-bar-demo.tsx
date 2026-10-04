"use client";

import { useState } from "react";

import { Input } from "@rhs-ui/primitives/input";
import { UnsavedChangesBar } from "@rhs-ui/primitives/unsaved-changes-bar";

const SAVED = "Northwind Studio";

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState(SAVED);
  const [name, setName] = useState("Northwind Studio Amsterdam");
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaved(name);
      setSaving(false);
    }, 700);
  };
  return (
    <div className="relative mx-auto flex h-72 max-w-xl flex-col gap-2 overflow-hidden p-8">
      <label htmlFor="ucb-name" className="text-sm font-medium">Workspace name</label>
      <Input id="ucb-name" value={name} onChange={(event) => setName(event.target.value)} />
      <p className="text-xs text-muted-foreground">Edit the name to bring the bar back.</p>
      <UnsavedChangesBar className="absolute" dirty={name !== saved} saving={saving} guardUnload={false} onSave={save} onDiscard={() => setName(saved)} />
    </div>
  );
}
