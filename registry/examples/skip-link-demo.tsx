import { SkipLink } from "@rhs-ui/primitives/skip-link";

export default function Demo(): React.JSX.Element {
  return (
    <div className="relative mx-auto max-w-xl overflow-clip rounded-2xl border border-border">
      <SkipLink target="skip-link-demo-main" className="absolute" />
      <div className="flex items-center gap-4 border-b border-border px-5 py-3 text-sm">
        <span className="font-medium">Ledger</span>
        {["Product", "Pricing", "Docs", "Blog"].map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="text-muted-foreground hover:text-foreground">{item}</a>)}
      </div>
      <div id="skip-link-demo-main" tabIndex={-1} className="p-5 text-sm text-muted-foreground outline-none">
        Press Tab inside this preview: the skip link appears first and jumps straight here, past the navigation.
      </div>
    </div>
  );
}
