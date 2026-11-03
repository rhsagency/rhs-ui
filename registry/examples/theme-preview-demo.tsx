import { IconCheck } from "@rhs-ui/icons";
import { ThemePreview, type PreviewTheme } from "@rhs-ui/marketing/theme-preview";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";

/* Two palettes of your own. Each theme brings its tokens, so the preview shows the real colours of a design system, not ours. */
const PALETTES: PreviewTheme[] = [
  {
    id: "paper",
    label: "Paper",
    tokens: {
      "--background": "oklch(0.97 0.008 85)",
      "--foreground": "oklch(0.24 0.01 70)",
      "--card": "oklch(0.99 0.005 85)",
      "--card-foreground": "oklch(0.24 0.01 70)",
      "--popover": "oklch(0.99 0.005 85)",
      "--popover-foreground": "oklch(0.24 0.01 70)",
      "--primary": "oklch(0.3 0.012 70)",
      "--primary-foreground": "oklch(0.97 0.008 85)",
      "--secondary": "oklch(0.93 0.01 85)",
      "--secondary-foreground": "oklch(0.3 0.012 70)",
      "--muted": "oklch(0.93 0.01 85)",
      "--muted-foreground": "oklch(0.46 0.012 70)",
      "--accent": "oklch(0.93 0.01 85)",
      "--accent-foreground": "oklch(0.24 0.01 70)",
      "--destructive": "oklch(0.55 0.19 28)",
      "--destructive-foreground": "oklch(0.99 0.005 85)",
      "--border": "oklch(0.87 0.012 85)",
      "--input": "oklch(0.87 0.012 85)",
      "--ring": "oklch(0.3 0.012 70)",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    scheme: "dark",
    tokens: {
      "--background": "oklch(0.18 0.012 255)",
      "--foreground": "oklch(0.96 0.006 255)",
      "--card": "oklch(0.23 0.014 255)",
      "--card-foreground": "oklch(0.96 0.006 255)",
      "--popover": "oklch(0.23 0.014 255)",
      "--popover-foreground": "oklch(0.96 0.006 255)",
      "--primary": "oklch(0.96 0.006 255)",
      "--primary-foreground": "oklch(0.18 0.012 255)",
      "--secondary": "oklch(0.3 0.015 255)",
      "--secondary-foreground": "oklch(0.94 0.006 255)",
      "--muted": "oklch(0.3 0.015 255)",
      "--muted-foreground": "oklch(0.78 0.012 255)",
      "--accent": "oklch(0.3 0.015 255)",
      "--accent-foreground": "oklch(0.96 0.006 255)",
      "--destructive": "oklch(0.7 0.18 25)",
      "--destructive-foreground": "oklch(0.18 0.012 255)",
      "--border": "oklch(0.32 0.015 255)",
      "--input": "oklch(0.32 0.015 255)",
      "--ring": "oklch(0.78 0.012 255)",
    },
  },
];

const FEATURES = ["Unlimited projects", "Shared inboxes and rules", "Priority support"];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">The sample screen, with the three built-in themes. The page around it keeps its own theme</p>
      <ThemePreview
        eyebrow="Theming"
        title="Dark mode is not an afterthought"
        description="Every component reads its colours from semantic tokens, so a theme is a set of values and nothing more. Switch the preview to see it, and press things to see their states."
      />
      <div className="mt-20 border-t border-border pt-12 sm:mt-24">
        <p className="mb-8 text-xs text-muted-foreground">Your own markup and your own palettes, starting in Midnight</p>
        <ThemePreview
          headingLevel={3}
          title="Your palette, on your markup"
          description="Pass themes with their tokens and children for the screen, and the preview shows your product as it is."
          themes={PALETTES}
          defaultTheme="midnight"
        >
          <div className="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div>
              <Badge variant="outline">Team plan</Badge>
              <p className="mt-4 text-3xl leading-[1.1] font-medium tracking-[-0.035em] text-balance">Everything a team needs, nothing it does not.</p>
              <p className="mt-3 max-w-md text-muted-foreground">One price per person. Add people when you hire them and remove them the day they leave.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button>Start a free trial</Button>
                <Button variant="outline">Talk to sales</Button>
              </div>
            </div>
            <Card className="gap-5">
              <CardHeader>
                <CardTitle>Team</CardTitle>
                <CardDescription>For groups of five to fifty</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-medium tracking-[-0.04em] tabular-nums">
                  $12<span className="ml-1.5 text-sm font-normal tracking-normal text-muted-foreground">per person, per month</span>
                </p>
                <ul className="mt-5 grid gap-2.5 text-sm">
                  {FEATURES.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <IconCheck className="size-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Choose Team</Button>
              </CardFooter>
            </Card>
          </div>
        </ThemePreview>
      </div>
    </div>
  );
}
