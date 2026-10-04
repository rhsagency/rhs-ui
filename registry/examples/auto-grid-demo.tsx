import { AutoGrid } from "@rhs-ui/primitives/auto-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-4xl gap-8 p-8">
      <AutoGrid min={12}>
        {["Roadmaps", "Cycles", "Decisions", "Releases", "Reports"].map((name) => (
          <div key={name} className="rounded-2xl border border-border p-5">
            <p className="font-medium">{name}</p>
            <p className="mt-1 text-sm text-muted-foreground">Columns appear as the space allows.</p>
          </div>
        ))}
      </AutoGrid>
      <div className="max-w-sm rounded-2xl bg-muted/50 p-4">
        <p className="mb-3 text-xs text-muted-foreground">The same grid in a narrow sidebar:</p>
        <AutoGrid min={8} gap="sm">
          {["A", "B", "C", "D"].map((name) => <div key={name} className="flex h-16 items-center justify-center rounded-xl border border-border bg-background text-sm">{name}</div>)}
        </AutoGrid>
      </div>
    </div>
  );
}
