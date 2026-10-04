import { IconLock, IconZap, IconGlobe } from "@rhs-ui/icons";
import { SpotlightCard } from "@rhs-ui/motion/spotlight-card";

export default function Demo(): React.JSX.Element {
  const cards = [
    { icon: <IconZap />, title: "Instant", text: "Every action under 100 ms." },
    { icon: <IconLock />, title: "Private", text: "Encrypted and hosted in the EU." },
    { icon: <IconGlobe />, title: "Everywhere", text: "Web, desktop and phone, in sync." },
  ];
  return (
    <div className="mx-auto grid max-w-4xl gap-4 p-10 sm:grid-cols-3">
      {cards.map((card) => (
        <SpotlightCard key={card.title}>
          <div className="p-6">
            <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border [&_svg]:size-5">{card.icon}</span>
            <h3 className="mt-6 text-base font-medium">{card.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{card.text}</p>
          </div>
        </SpotlightCard>
      ))}
    </div>
  );
}
