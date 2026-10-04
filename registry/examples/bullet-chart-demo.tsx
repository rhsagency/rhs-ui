import { BulletChart } from "@rhs-ui/dashboard/bullet-chart";

const euros = (value: number) => `€${value}k`;
const percent = (value: number) => `${value}%`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <BulletChart label="Revenue" value={270} target={250} ranges={[150, 225, 300]} format={euros} />
      <BulletChart label="Profit margin" value={18} target={24} ranges={[10, 20, 30]} format={percent} />
      <BulletChart label="Customer satisfaction" value={4.1} target={4.5} ranges={[3, 4, 5]} />
    </div>
  );
}
