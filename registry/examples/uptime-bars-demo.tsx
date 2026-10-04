import { UptimeBars, type UptimeDay } from "@rhs-ui/dashboard/uptime-bars";

const MONTHS = ["March", "April"];

function days(seed: number, dips: Record<number, number>): UptimeDay[] {
  return Array.from({ length: 45 }, (_, index) => {
    const day = index + 1 + seed;
    const date = day <= 31 ? `${day} ${MONTHS[0]}` : `${day - 31} ${MONTHS[1]}`;
    return { date, uptime: index < 3 && seed > 0 ? null : (dips[index] ?? 1) };
  });
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <UptimeBars label="API" days={days(0, { 12: 0.982, 30: 0.999 })} />
      <UptimeBars label="Dashboard" days={days(0, {})} />
      <UptimeBars label="Webhooks" days={days(1, { 20: 0.91, 21: 0.995 })} />
    </div>
  );
}
