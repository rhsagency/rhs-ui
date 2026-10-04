import { IconImage, IconLayers } from "@rhs-ui/icons";
import { PressKit } from "@rhs-ui/marketing/press-kit";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <PressKit
        title="Press kit"
        description="Logos, photos and the facts, ready to use. Please do not stretch the logo."
        facts={[
          { label: "Founded", value: "2019, Utrecht" },
          { label: "Team", value: "34 people" },
          { label: "Customers", value: "1,800 teams" },
          { label: "Funding", value: "Bootstrapped" },
        ]}
        contact={<>Questions? <a href="mailto:press@example.com" className="font-medium underline underline-offset-4">press@example.com</a></>}
        assets={[
          { title: "Logo, dark", detail: "SVG and PNG, 120 KB", href: "#logo-dark", preview: <span className="flex items-center gap-2 text-2xl font-medium tracking-[-.04em]"><IconLayers /> Ledger</span> },
          { title: "Logo, light", detail: "SVG and PNG, 118 KB", href: "#logo-light", dark: true, preview: <span className="flex items-center gap-2 text-2xl font-medium tracking-[-.04em]"><IconLayers /> Ledger</span> },
          { title: "Product screenshots", detail: "12 PNG files, 18 MB", href: "#screens", preview: <IconImage /> },
          { title: "Founder photos", detail: "6 JPG files, 24 MB", href: "#photos", preview: <IconImage /> },
        ]}
      />
    </div>
  );
}
