"use client";

import { AnnouncementBar } from "@rhs-ui/marketing/announcement-bar";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <AnnouncementBar href="#" linkLabel="See the release" dismissible className="rounded-lg">
        Version 3 is here: offline mode and a new editor.
      </AnnouncementBar>
    </div>
  );
}
