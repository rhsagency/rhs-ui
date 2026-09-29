import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { Separator } from "@rhs-ui/primitives/separator";

const RELEASES = Array.from({ length: 24 }, (_, index) => `v0.${24 - index}.0`);

export default function Demo(): React.JSX.Element {
  return (
    <ScrollArea className="h-64 w-56 rounded-lg border border-border">
      <div className="p-4">
        <p className="mb-3 text-sm font-medium">Releases</p>
        {RELEASES.map((release, index) => (
          <div key={release}>
            <p className="py-2 font-mono text-xs">{release}</p>
            {index < RELEASES.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
