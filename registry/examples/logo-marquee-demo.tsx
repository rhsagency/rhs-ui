import { LogoMarquee } from "@rhs-ui/marketing/logo-marquee";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <LogoMarquee
        title="Teams that ship with us"
        logos={["Northwind", "Halcyon", "Fieldwork", "Atlas & Co", "Meridian", "Quanta", "Brightline", "Oakmont"].map((name) => ({ name }))}
      />
    </div>
  );
}
