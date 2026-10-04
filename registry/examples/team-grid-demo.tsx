import { TeamGrid } from "@rhs-ui/marketing/team-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TeamGrid
        eyebrow="The team"
        title="Eight people, one studio"
        description="Designers and engineers who have shipped together for a decade."
        members={[
          { id: "1", name: "Anouk de Wit", role: "Founder, design", links: [{ label: "LinkedIn", href: "#" }] },
          { id: "2", name: "Ravi Menon", role: "Engineering lead" },
          { id: "3", name: "Femke Bos", role: "Product designer" },
          { id: "4", name: "Luca Romano", role: "Front-end engineer" },
          { id: "5", name: "Mei Tanaka", role: "Brand designer" },
          { id: "6", name: "Daan Peters", role: "Back-end engineer" },
          { id: "7", name: "Sara Haddad", role: "Producer" },
          { id: "8", name: "Ole Hansen", role: "Motion designer" },
        ]}
      />
    </div>
  );
}
