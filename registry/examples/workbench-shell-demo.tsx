"use client";

import { useState, type ReactNode } from "react";

import { WorkbenchShell, type WorkbenchLayout } from "@rhs-ui/application/workbench-shell";
import { IconAlertCircle, IconBraces, IconCheck, IconFileCode, IconFileText, IconFolder, IconFunction, IconGitBranch, IconHash, IconPlay, IconRedo, IconSearch, IconUndo, IconWarning, IconAlignLeft } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@rhs-ui/primitives/breadcrumb";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { Toolbar } from "@rhs-ui/primitives/toolbar";
import { TreeView, type TreeNode } from "@rhs-ui/primitives/tree-view";

const FILES: readonly TreeNode[] = [
  {
    id: "halcyon-web",
    label: "halcyon-web",
    icon: <IconFolder />,
    children: [
      {
        id: "app",
        label: "app",
        icon: <IconFolder />,
        children: [
          {
            id: "app/pricing",
            label: "pricing",
            icon: <IconFolder />,
            children: [
              { id: "app/pricing/page.tsx", label: "page.tsx", icon: <IconFileCode /> },
              { id: "app/pricing/plans.ts", label: "plans.ts", icon: <IconFileCode /> },
            ],
          },
          { id: "app/layout.tsx", label: "layout.tsx", icon: <IconFileCode /> },
          { id: "app/globals.css", label: "globals.css", icon: <IconFileCode /> },
        ],
      },
      {
        id: "components",
        label: "components",
        icon: <IconFolder />,
        children: [
          { id: "components/plan-card.tsx", label: "plan-card.tsx", icon: <IconFileCode /> },
          { id: "components/price-toggle.tsx", label: "price-toggle.tsx", icon: <IconFileCode /> },
        ],
      },
      { id: "lib", label: "lib", icon: <IconFolder />, children: [{ id: "lib/format-price.ts", label: "format-price.ts", icon: <IconFileCode /> }] },
      { id: "package.json", label: "package.json", icon: <IconFileText /> },
      { id: "README.md", label: "README.md", icon: <IconFileText /> },
    ],
  },
];

const CODE = [
  'import { PlanCard } from "@/components/plan-card";',
  'import { formatPrice } from "@/lib/format-price";',
  'import { plans } from "./plans";',
  "",
  "// Prices come from plans.ts, so the marketing site and the checkout always agree.",
  "export default function PricingPage() {",
  "  const annual = true;",
  "",
  "  return (",
  '    <main className="mx-auto max-w-5xl px-6 py-16">',
  '      <h2 className="text-3xl font-semibold tracking-tight">Pick the plan that fits your studio</h2>',
  '      <p className="mt-3 max-w-prose text-muted-foreground">',
  "        Every plan includes unlimited projects, the design system and priority support in launch weeks.",
  "      </p>",
  '      <div className="mt-10 grid gap-4 md:grid-cols-3">',
  "        {plans.map((plan) => (",
  '          <PlanCard key={plan.id} name={plan.name} price={formatPrice(plan.monthly, { annual })} highlighted={plan.id === "studio"} />',
  "        ))}",
  "      </div>",
  "    </main>",
  "  );",
  "}",
];
const CURRENT = 11;

/** Monochrome syntax: keywords in a heavier weight, strings and comments in the muted colour. */
function highlight(line: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(/(\/\/.*$)|("[^"]*")|(\b(?:import|from|export|default|function|const|return)\b)/g)) {
    const at = match.index ?? 0;
    if (at > last) parts.push(line.slice(last, at));
    const cls = match[1] ? "text-muted-foreground italic" : match[2] ? "text-muted-foreground" : "font-semibold";
    parts.push(
      <span key={at} className={cls}>
        {match[0]}
      </span>,
    );
    last = at + match[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

function Editor(): React.JSX.Element {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-4 text-xs">
        <IconFileCode aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <span className="font-medium">page.tsx</span>
        <Badge variant="muted" className="h-[1.125rem] px-1.5 text-[0.6875rem]">
          Modified
        </Badge>
      </div>
      {/* Code reads left to right in every direction: the scroller itself, not just the lines, so a mirrored page still starts at the first character. */}
      <div role="region" aria-label="Source of page.tsx" tabIndex={0} dir="ltr" className="relative min-h-0 flex-1 overflow-auto py-3 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40">
        <pre dir="ltr" className="w-max min-w-full font-mono text-[0.8125rem] leading-6">
          <code>
            {CODE.map((line, index) => (
              <span key={index} className={`flex pr-6 ${index + 1 === CURRENT ? "bg-muted" : ""}`}>
                <span aria-hidden="true" className={`sticky left-0 w-12 shrink-0 pr-4 text-right tabular-nums select-none ${index + 1 === CURRENT ? "bg-muted text-foreground" : "bg-background text-muted-foreground"}`}>
                  {index + 1}
                </span>
                <span>{line === "" ? " " : highlight(line)}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid gap-3">
      <h2 className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Inspector(): React.JSX.Element {
  const [statik, setStatik] = useState(true);
  return (
    <div className="grid gap-6 p-4">
      <Group title="Page">
        <div className="grid gap-1.5">
          <Label htmlFor="wb-title">Title</Label>
          <Input id="wb-title" defaultValue="Pricing" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="wb-route">Route</Label>
          <Input id="wb-route" readOnly value="/pricing" className="font-mono text-[0.8125rem]" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="wb-static">Render ahead of time</Label>
          <Switch id="wb-static" checked={statik} onCheckedChange={setStatik} />
        </div>
      </Group>
      <Group title="Outline">
        <ul className="grid gap-0.5 text-sm">
          {[
            { icon: <IconFunction />, name: "PricingPage", line: 6 },
            { icon: <IconHash />, name: "annual", line: 7 },
            { icon: <IconBraces />, name: "plans.map", line: 16 },
          ].map((symbol) => (
            <li key={symbol.name}>
              <button type="button" className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-start outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4 [&_svg]:text-muted-foreground">
                {symbol.icon}
                <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem]">{symbol.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  <span className="sr-only">line </span>
                  {symbol.line}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="Problems">
        <ul className="grid gap-2 text-sm">
          <li className="flex gap-2">
            <IconWarning aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">Warning.</span> The page title is an h2; use an h1 for the main heading. <span className="text-muted-foreground tabular-nums">Line 11</span>
            </span>
          </li>
          <li className="flex gap-2">
            <IconWarning aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">Warning.</span> The line is longer than 100 characters. <span className="text-muted-foreground tabular-nums">Line 17</span>
            </span>
          </li>
        </ul>
      </Group>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState("app/pricing/page.tsx");
  const [layout, setLayout] = useState<Pick<WorkbenchLayout, "explorer" | "inspector">>({ explorer: 260, inspector: 320 });

  return (
    <WorkbenchShell
      // The panels sit beside the canvas from the least width they all fit in, so a preview pane that is not a full screen still shows the whole workbench.
      breakpoint={48}
      onSizesChange={(next) => setLayout({ explorer: next.explorer, inspector: next.inspector })}
      toolbar={
        <div className="flex w-full min-w-max items-center gap-3">
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap gap-1.5 whitespace-nowrap sm:gap-1.5">
              <BreadcrumbItem className="@max-xl:hidden">halcyon-web</BreadcrumbItem>
              <BreadcrumbSeparator className="@max-xl:hidden" />
              <BreadcrumbItem className="@max-xl:hidden">app</BreadcrumbItem>
              <BreadcrumbSeparator className="@max-xl:hidden" />
              <BreadcrumbItem className="@max-xl:hidden">pricing</BreadcrumbItem>
              <BreadcrumbSeparator className="@max-xl:hidden" />
              <BreadcrumbItem>
                <BreadcrumbPage>page.tsx</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Toolbar
            label="Editor"
            className="ms-auto @max-sm:hidden"
            groups={[
              [
                { id: "undo", label: "Undo", icon: <IconUndo /> },
                { id: "redo", label: "Redo", icon: <IconRedo />, disabled: true },
              ],
              [
                { id: "format", label: "Format document", icon: <IconAlignLeft /> },
                { id: "find", label: "Find in file", icon: <IconSearch /> },
              ],
            ]}
          />
          <Button size="sm">
            <IconPlay />
            <span className="@max-xl:sr-only">Preview</span>
          </Button>
        </div>
      }
      explorer={
        <div className="p-2">
          <TreeView label="Project files" nodes={FILES} selected={selected} onSelectedChange={setSelected} defaultExpanded={["halcyon-web", "app", "app/pricing"]} />
        </div>
      }
      canvas={<Editor />}
      inspector={<Inspector />}
      status={
        <>
          <span className="inline-flex items-center gap-1.5">
            <IconGitBranch aria-hidden="true" className="size-3.5" />
            main
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconAlertCircle aria-hidden="true" className="size-3.5" />0<span className="@max-xl:sr-only"> errors</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconWarning aria-hidden="true" className="size-3.5" />2<span className="@max-xl:sr-only"> warnings</span>
          </span>
          <span className="ms-auto tabular-nums">Ln 11, Col 24</span>
          <span className="@max-xl:hidden">Spaces: 2</span>
          <span className="@max-xl:hidden">UTF-8</span>
          <span className="@max-xl:hidden">TypeScript React</span>
          <span className="tabular-nums @max-3xl:hidden" title="Width of the explorer and the inspector in px, as onSizesChange reports them">
            Panels {layout.explorer} | {layout.inspector}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <IconCheck aria-hidden="true" className="size-3.5" />
            Saved
          </span>
        </>
      }
    />
  );
}
