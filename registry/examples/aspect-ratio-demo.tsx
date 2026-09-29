import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-md grid-cols-[2fr_1fr] gap-3">
      <AspectRatio ratio={16 / 9} className="grid place-items-center rounded-lg border border-border bg-muted">
        <span className="font-mono text-xs text-muted-foreground">16 : 9</span>
      </AspectRatio>
      <AspectRatio ratio={4 / 5} className="grid place-items-center rounded-lg border border-border bg-muted">
        <span className="font-mono text-xs text-muted-foreground">4 : 5</span>
      </AspectRatio>
    </div>
  );
}
