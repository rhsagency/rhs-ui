import { ParallaxLayer } from "@rhs-ui/motion/parallax-layer";

export default function Demo(): React.JSX.Element {
  return (
    <div className="relative h-[30rem] w-full overflow-y-auto rounded-xl border border-border bg-muted/40">
      <div className="grid h-72 place-items-center text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Scroll inside this panel</p>
      </div>
      <section className="relative mx-6 h-[26rem] overflow-clip rounded-2xl border border-border bg-foreground text-background">
        <ParallaxLayer speed={-0.35} className="absolute top-10 left-8 h-40 w-56 rounded-xl border border-background/20 bg-background/10" />
        <ParallaxLayer speed={0.5} rotate={-6} className="absolute right-10 bottom-8 h-48 w-40 rounded-xl border border-background/25 bg-background/15" />
        <ParallaxLayer speed={0.9} zoom={0.1} className="absolute top-1/3 right-1/3 size-20 rounded-full bg-background/80" />
        <div className="relative grid h-full place-items-center px-8 text-center">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70">Depth, not decoration</p>
            <p className="mt-3 max-w-[14ch] text-3xl font-medium tracking-tight">Every layer at its own pace.</p>
          </div>
        </div>
      </section>
      <div className="h-80" />
    </div>
  );
}
