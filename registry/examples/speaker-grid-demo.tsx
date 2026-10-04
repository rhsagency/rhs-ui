import { SpeakerGrid } from "@rhs-ui/marketing/speaker-grid";

const portrait = (fill: string, skin: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='${fill}'/><circle cx='200' cy='170' r='80' fill='${skin}'/><path d='M60 400 Q200 250 340 400Z' fill='${skin}'/></svg>`);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <SpeakerGrid
        title="Speakers"
        description="Practitioners, not pundits. Every talk ends with something you can try on Monday."
        speakers={[
          { id: "1", name: "Anouk de Wit", role: "CEO, Ledger", talk: "Software that leaves you alone", photo: <img src={portrait("#d8d3c9", "#8d877c")} alt="" />, href: "#s1" },
          { id: "2", name: "Mara Lindqvist", role: "Head of Design, Fieldwork", talk: "A decision log your team will read", photo: <img src={portrait("#3b3e43", "#cfc9be")} alt="" />, href: "#s2" },
          { id: "3", name: "Luca Romano", role: "CTO, Quanta", talk: "Pricing without dark patterns", photo: <img src={portrait("#bdb6aa", "#3a3c40")} alt="" />, href: "#s3" },
          { id: "4", name: "Mei Tanaka", role: "Designer, Brightline", talk: "Accessible charts in practice", photo: <img src={portrait("#9aa0a6", "#e5e2dc")} alt="" />, href: "#s4" },
        ]}
      />
    </div>
  );
}
