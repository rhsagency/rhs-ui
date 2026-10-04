import { ScrollCue } from "@rhs-ui/primitives/scroll-cue";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex min-h-40 items-end justify-center p-6">
      <ScrollCue target="next-section" />
    </div>
  );
}
