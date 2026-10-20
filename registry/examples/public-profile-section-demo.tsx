"use client";

import { useState } from "react";

import { PublicProfileSection, type PublicProfile } from "@rhs-ui/application/public-profile-section";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A drawn portrait, so the demo needs no photo and no network. */
const portrait =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='#dcd8d0'/><path d='M18 120c2-26 20-40 42-40s40 14 42 40z' fill='#5f5a52'/><circle cx='60' cy='46' r='20' fill='#8c867a'/><path d='M38 44c2-14 12-22 24-22s20 8 21 20c-6-8-14-12-24-12s-16 4-21 14z' fill='#3d3a35'/></svg>",
  );

const TAKEN = ["admin", "halcyon", "kestrel", "northwind", "mara"];

export default function Demo(): React.JSX.Element {
  const [profile, setProfile] = useState<PublicProfile>({
    avatar: portrait,
    displayName: "Mara Okafor",
    username: "mara_okafor",
    bio: "Product designer at Halcyon. I make calm interfaces for busy teams and write about it on Sundays.",
    links: [
      { id: "portfolio", label: "Portfolio", url: "https://maraokafor.studio" },
      { id: "journal", label: "Journal", url: "https://journal.maraokafor.studio/notes" },
    ],
  });
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <PublicProfileSection
        profile={profile}
        onCheckUsername={async (name) => {
          await wait(600);
          return !TAKEN.includes(name.toLowerCase());
        }}
        onSave={async (next) => {
          await wait(800);
          setProfile(next);
        }}
      />
      <p className="mt-3 text-center text-xs text-muted-foreground">Try the usernames admin or halcyon to see a name that is taken.</p>
    </div>
  );
}
