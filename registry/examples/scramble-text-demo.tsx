import { ScrambleText } from "@rhs-ui/motion/scramble-text";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-10 text-center">
      <h2 className="text-3xl font-medium tracking-[-.03em]">
        <ScrambleText text="SYSTEM ONLINE" duration={1200} />
      </h2>
      <a href="#" className="rounded-full border border-border px-5 py-2.5 text-sm">
        <ScrambleText text="Hover to decode" trigger="hover" />
      </a>
    </div>
  );
}
