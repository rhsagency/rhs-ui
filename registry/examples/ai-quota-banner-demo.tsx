import { AiQuotaBanner } from "@rhs-ui/application/ai-quota-banner";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const upgrade = <Button size="sm" variant="outline">Upgrade</Button>;
  return (
    <div className="mx-auto grid max-w-xl gap-3 p-8">
      <AiQuotaBanner used={12} limit={50} unit="messages" resets="resets at midnight" action={upgrade} />
      <AiQuotaBanner used={44} limit={50} unit="messages" resets="resets at midnight" action={upgrade} />
      <AiQuotaBanner used={50} limit={50} unit="messages" resets="resets at midnight" action={upgrade} />
    </div>
  );
}
