import { IconLaptop, IconMonitor, IconTerminal } from "@rhs-ui/icons";
import { DownloadSection } from "@rhs-ui/marketing/download-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <DownloadSection
        title="Download Ledger for desktop."
        description="Offline drafts, global shortcuts and native notifications. Free with every plan."
        options={[
          { platform: "macOS", icon: <IconLaptop />, href: "#mac", detail: "Apple silicon and Intel", meta: "v2.4.1, 92 MB" },
          { platform: "Windows", icon: <IconMonitor />, href: "#windows", detail: "64-bit installer", meta: "v2.4.1, 88 MB" },
          { platform: "Linux", icon: <IconTerminal />, href: "#linux", detail: "AppImage and .deb", meta: "v2.4.1, 95 MB" },
        ]}
        footer={<><a href="#notes">Release notes</a> · <a href="#checksums">Checksums</a> · <a href="#older">Older versions</a></>}
      />
    </div>
  );
}
