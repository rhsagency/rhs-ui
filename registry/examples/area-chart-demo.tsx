import { AreaChart } from "@rhs-ui/dashboard/area-chart";

const DAYS = Array.from({ length: 30 }, (_, i) => ({ day: `${i + 1} Sep`, visitors: Math.round(2400 + i * 60 + Math.sin(i * 0.8) * 420 + (i % 7 >= 5 ? -500 : 0)), signups: Math.round(180 + i * 6 + Math.cos(i * 0.6) * 40) }));

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full max-w-2xl">
      <AreaChart data={DAYS} index="day" series={[{ key: "visitors", label: "Visitors" }, { key: "signups", label: "Sign-ups" }]} label="Visitors and sign-ups, September" />
    </div>
  );
}
