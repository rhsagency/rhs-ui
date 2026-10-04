import { LoadingDots } from "@rhs-ui/primitives/loading-dots";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-10 p-10">
      <LoadingDots size="sm" label="Saving" />
      <LoadingDots label="Loading results" />
      <span className="inline-flex items-center gap-3 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
        Assistant is typing <LoadingDots size="sm" label="Assistant is typing" />
      </span>
    </div>
  );
}
