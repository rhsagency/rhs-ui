import { LogoStats } from "@rhs-ui/marketing/logo-stats";

function Wordmark({ name, weight = 600 }: { name: string; weight?: number }): React.JSX.Element {
  return (
    <svg role="img" aria-label={name} viewBox="0 0 140 28" className="h-7 w-auto">
      <text x="0" y="21" fontSize="20" fontWeight={weight} fill="currentColor" letterSpacing="-0.5">{name}</text>
    </svg>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <LogoStats
        title="Trusted by 2,400 teams across Europe"
        logos={[
          { name: "Northwind", logo: <Wordmark name="Northwind" /> },
          { name: "Halcyon", logo: <Wordmark name="Halcyon" weight={500} /> },
          { name: "Kestrel", logo: <Wordmark name="Kestrel" weight={700} /> },
          { name: "Polder", logo: <Wordmark name="Polder" /> },
          { name: "Lumen", logo: <Wordmark name="Lumen" weight={500} /> },
        ]}
        stats={[
          { value: "2,400", label: "Teams" },
          { value: "99.98%", label: "Uptime last year" },
          { value: "8 min", label: "Median first reply" },
          { value: "4.8/5", label: "Average rating" },
        ]}
      />
    </div>
  );
}
