"use client";

import { useState } from "react";

import { WorkspaceProfileSection, type Workspace } from "@rhs-ui/application/workspace-profile-section";

const INITIAL: Workspace = {
  name: "Northwind Studio",
  slug: "northwind-studio",
  timeZone: "Europe/Amsterdam",
  language: "en",
  id: "ws_4f9k2m8q1xz7",
};

// In this preview these addresses are "taken".
const TAKEN = new Set(["northwind", "kestrel", "halcyon", "polder"]);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [workspace, setWorkspace] = useState(INITIAL);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-xs text-muted-foreground">In this preview the addresses northwind, kestrel, halcyon and polder are already taken.</p>
      <WorkspaceProfileSection
        workspace={workspace}
        baseUrl="app.kestrel.dev"
        onCheckSlug={async (slug) => {
          await wait(350);
          return !TAKEN.has(slug);
        }}
        onSave={async (changes) => {
          await wait(800);
          setWorkspace((current) => ({ ...current, ...changes }));
        }}
      />
    </div>
  );
}
