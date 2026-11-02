import type { ReactNode } from "react";

import { IconGlobe, IconLaptop, IconMonitor, IconSmartphone, IconTerminal } from "@rhs-ui/icons";
import { PlatformAvailability } from "@rhs-ui/marketing/platform-availability";

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
      <Example caption="Six platforms, each with its status in words, the version and the day it shipped, and a link to get it. Android is in beta and Windows is on its way, with a waiting list instead of a download">
        <PlatformAvailability
          eyebrow="Get the app"
          title="Where Halcyon runs"
          description="One account on every device. This list is kept current: it shows what you can install today and what is on the way."
          platforms={[
            { id: "web", label: "Web", icon: <IconGlobe />, status: "available", note: "Nothing to install. Always the latest version.", href: "#app", linkLabel: "Open the app" },
            { id: "ios", label: "iOS", icon: <IconSmartphone />, status: "available", version: "4.2.0", releasedAt: "2026-10-14", note: "Requires iOS 17 or later.", href: "#ios", linkLabel: "App Store" },
            { id: "android", label: "Android", icon: <IconSmartphone />, status: "beta", version: "4.2.0-beta.3", releasedAt: "2026-10-21", note: "Open to everyone on Google Play. Tell us what breaks.", href: "#android", linkLabel: "Join the beta" },
            { id: "macos", label: "macOS", icon: <IconLaptop />, status: "available", version: "4.1.2", releasedAt: "2026-09-30", note: "Apple silicon and Intel, macOS 13 or later.", href: "#macos", linkLabel: "Download" },
            { id: "windows", label: "Windows", icon: <IconMonitor />, status: "soon", note: "Planned for early 2027. Leave your email and we will write once, when it is ready.", href: "#windows-waitlist" },
            { id: "api", label: "API and CLI", icon: <IconTerminal />, status: "available", version: "3.0.1", releasedAt: "2026-10-02", note: "The REST API and the command line tool, on every plan.", href: "#developers", linkLabel: "Read the docs" },
          ]}
          footnote="Release dates are in UTC. Older versions keep working for 12 months after a new one ships."
        />
      </Example>
      <div className="mx-auto mt-20 max-w-2xl border-t border-border pt-12 sm:mt-24">
        <Example caption="In a narrow column with the dates written for a UK reader: two tiles across, and a coming-soon tile with nothing to click">
          <PlatformAvailability
            headingLevel={3}
            title="Also on your desk"
            locale="en-GB"
            platforms={[
              { id: "mac", label: "macOS", icon: <IconLaptop />, status: "available", version: "4.1.2", releasedAt: "2026-09-30", href: "#macos", linkLabel: "Download" },
              { id: "win", label: "Windows", icon: <IconMonitor />, status: "beta", version: "0.9.4", releasedAt: "2026-10-24", href: "#windows", linkLabel: "Join the beta" },
              { id: "linux", label: "Linux", icon: <IconTerminal />, status: "soon", note: "Planned for later in 2027. The web app works in any browser until then." },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
