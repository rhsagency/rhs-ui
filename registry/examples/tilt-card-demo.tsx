import { TiltCard } from "@rhs-ui/motion/tilt-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 p-10 sm:grid-cols-2">
      <TiltCard>
        <div className="flex aspect-[4/5] flex-col justify-between p-6">
          <span className="text-xs uppercase tracking-[.18em] text-muted-foreground">Member card</span>
          <div>
            <p className="font-mono text-sm tracking-[.2em] text-muted-foreground">0042 1187 5530</p>
            <p className="mt-2 text-2xl font-medium tracking-[-.03em]">Anouk de Wit</p>
          </div>
        </div>
      </TiltCard>
      <TiltCard max={5}>
        <div className="flex aspect-[4/5] flex-col justify-end bg-muted p-6">
          <p className="text-xs text-muted-foreground">Edition 03</p>
          <p className="mt-1 text-xl font-medium">Field notes on calm software</p>
        </div>
      </TiltCard>
    </div>
  );
}
