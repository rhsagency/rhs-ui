import { AiContextMeter } from "@rhs-ui/application/ai-context-meter";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 p-10">
      <AiContextMeter used={12_400} limit={200_000} />
      <AiContextMeter used={118_000} limit={200_000} />
      <AiContextMeter used={176_500} limit={200_000} />
    </div>
  );
}
