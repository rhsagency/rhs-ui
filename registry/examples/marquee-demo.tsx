import { Marquee } from "@rhs-ui/primitives/marquee";

const LOGOS = ["Northwind", "Harbour & Co", "Fieldwork", "Oak Lane", "Mirror Labs", "Studio North", "Atelier Moreau", "Orbit"];

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-6">
      <Marquee label="Teams building with RHS UI" duration={32}>
        {LOGOS.map((name) => (
          <span key={name} className="text-xl font-semibold tracking-tight whitespace-nowrap text-muted-foreground">
            {name}
          </span>
        ))}
      </Marquee>
      <Marquee label="What people say" duration={48} direction="right">
        {["Shipped in three weeks", "Every state designed", "Accessible by default", "Our own look, not a kit", "Docs we actually read"].map((line) => (
          <span key={line} className="rounded-full border border-border px-4 py-1.5 text-sm whitespace-nowrap">
            {line}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
