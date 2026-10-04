import { MinimalHero } from "@rhs-ui/marketing/minimal-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <MinimalHero
        title="We design buildings that age well."
        subtitle="An architecture studio in Rotterdam, working on homes, schools and the spaces between them."
        links={[{ label: "See the work", href: "#work" }, { label: "Studio", href: "#studio" }]}
        meta={<><span>Rotterdam, since 2011</span><span>Taking on projects for 2027</span></>}
      />
    </div>
  );
}
