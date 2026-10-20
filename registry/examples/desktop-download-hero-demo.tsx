import { IconCheck } from "@rhs-ui/icons";
import { DesktopDownloadHero, type DesktopPlatform } from "@rhs-ui/marketing/desktop-download-hero";

const platforms: DesktopPlatform[] = [
  { id: "macos-arm64", label: "macOS", arch: "Apple silicon", href: "/downloads/lumen-1.8.2-arm64.dmg", size: "118 MB" },
  { id: "macos-x64", label: "macOS", arch: "Intel", href: "/downloads/lumen-1.8.2-x64.dmg", size: "124 MB" },
  { id: "windows-x64", label: "Windows", arch: "x64", href: "/downloads/lumen-1.8.2-x64.exe", size: "96 MB" },
  { id: "windows-arm64", label: "Windows", arch: "ARM64", href: "/downloads/lumen-1.8.2-arm64.exe", size: "94 MB" },
  { id: "linux-appimage", label: "Linux", arch: "AppImage", href: "/downloads/lumen-1.8.2.AppImage", size: "102 MB", cpu: "x64" },
  { id: "linux-deb", label: "Linux", arch: ".deb", href: "/downloads/lumen-1.8.2-amd64.deb", size: "88 MB", cpu: "x64" },
];

/* A beta that ships for one system only: there is nothing to put in a menu. */
const beta: DesktopPlatform[] = [{ id: "windows-x64", label: "Windows", arch: "x64", href: "/downloads/lumen-2.0.0-beta.3-x64.exe", size: "98 MB" }];

const requirements = [
  "macOS 13 or later, on Apple silicon or Intel",
  "Windows 10 (22H2) or later, 64-bit",
  "Ubuntu 22.04, Fedora 39 or any distribution with glibc 2.35",
  "4 GB of memory and 300 MB of disk space",
];

/* The app, drawn for the demo, so it is hidden from screen readers: it is a picture, not page content. In your app: a screenshot with alt text. */
const notebooks = ["Inbox", "Q4 planning", "Reading list", "Recipes"];
const app = (
  <div aria-hidden="true" className="grid grid-cols-1 text-sm sm:min-h-[22rem] sm:grid-cols-[11rem_1fr]">
    <div className="hidden border-r border-border bg-muted/40 p-4 sm:block">
      <p className="px-2 text-xs font-medium text-muted-foreground">Notebooks</p>
      <ul className="mt-2 space-y-0.5">
        {notebooks.map((name, index) => (
          <li key={name} className={index === 1 ? "rounded-md bg-background px-2 py-1.5 font-medium shadow-xs" : "px-2 py-1.5 text-muted-foreground"}>
            {name}
          </li>
        ))}
      </ul>
      <p className="mt-6 px-2 text-xs font-medium text-muted-foreground">Synced</p>
      <p className="mt-1 px-2 text-xs text-muted-foreground">Encrypted, 2 minutes ago</p>
    </div>
    <div className="p-5 sm:p-7">
      <p className="text-xs text-muted-foreground">Tuesday, 20 October</p>
      <h3 className="mt-2 text-xl font-medium tracking-[-0.02em]">Q4 planning</h3>
      <p className="mt-3 hidden max-w-sm leading-relaxed text-muted-foreground sm:block">Three bets for the quarter, in the order we will drop them if the schedule slips.</p>
      <ul className="mt-5 space-y-2.5">
        {[
          ["Ship offline search", true],
          ["Move billing to annual plans", true],
          ["Interview four design leads", false],
          ["Write the migration guide", false],
        ].map(([label, done]) => (
          <li key={String(label)} className="flex items-center gap-2.5">
            <span className={done ? "grid size-4 place-items-center rounded-sm bg-foreground text-background" : "size-4 rounded-sm border border-border"}>{done ? <IconCheck className="size-3" /> : null}</span>
            <span className={done ? "text-muted-foreground line-through" : ""}>{String(label)}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">The visitor's system is known: one button, the rest in the menu</p>
      <DesktopDownloadHero
        className="pt-8 sm:pt-8"
        title="Notes that stay on your machine."
        description="Lumen is a fast, offline-first notes app with end-to-end encrypted sync, for people who write all day."
        platforms={platforms}
        version="1.8.2"
        releasedAt="2026-10-14"
        requirements={requirements}
        detect="macos-arm64"
        window={app}
        windowTitle="Q4 planning · Lumen"
      />
      <p className="border-t border-border pt-6 text-xs text-muted-foreground">The system is not recognised: every build stays an equal button</p>
      <DesktopDownloadHero
        className="pt-8 sm:pt-8"
        title="Download Lumen for your desktop."
        description="Free for personal use, with every build signed and notarised."
        platforms={platforms}
        version="1.8.2"
        releasedAt="2026-10-14"
        requirements={requirements}
        detect="none"
        window={app}
        windowTitle="Q4 planning · Lumen"
      />
      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A single build: there is no menu, so the button stands alone</p>
      <DesktopDownloadHero
        className="pt-8 sm:pt-8"
        title="Try the Lumen beta on Windows."
        description="The macOS and Linux apps follow once sync is stable. Until then, Windows gets every new feature first."
        platforms={beta}
        version="2.0.0-beta.3"
        releasedAt="2026-10-19"
        requirements={["Windows 10 (22H2) or later, 64-bit", "4 GB of memory and 300 MB of disk space"]}
        detect="windows-x64"
        window={app}
        windowTitle="Q4 planning · Lumen"
      />
    </div>
  );
}
