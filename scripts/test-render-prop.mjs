// Base UI's render prop on RHS UI's parts renders exactly what asChild renders (render-prop.ts). In a Base UI project
// the shadcn CLI rewrites `<X asChild><a /></X>` into `<X render={<a />}>`, so the two must be the same markup, part by
// part, in their own roots. A raw Radix part without renderAs is the negative control: there the two differ.
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, ".scratch/render-prop.cjs");
mkdirSync(path.dirname(out), { recursive: true });
await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
  import assert from "node:assert/strict";
  import { createElement as h } from "react";
  import { renderToStaticMarkup as render } from "react-dom/server";
  import { Tooltip as TooltipPrimitive } from "radix-ui";
  import { Button } from "./registry/primitives/button";
  import { Badge } from "./registry/primitives/badge";
  import { BreadcrumbLink } from "./registry/primitives/breadcrumb";
  import { Collapsible, CollapsibleTrigger } from "./registry/primitives/collapsible";
  import { Dialog, DialogClose, DialogTrigger } from "./registry/primitives/dialog";
  import { DropdownMenu, DropdownMenuTrigger } from "./registry/primitives/dropdown-menu";
  import { Popover, PopoverTrigger } from "./registry/primitives/popover";
  import { Sheet, SheetTrigger } from "./registry/primitives/sheet";
  import { Tooltip, TooltipProvider, TooltipTrigger } from "./registry/primitives/tooltip";

  const link = (children) => h("a", { href: "/guide", className: "x" }, children);
  const parts = [
    ["Button", (p, c) => h(Button, p, c)],
    ["Badge", (p, c) => h(Badge, p, c)],
    ["BreadcrumbLink", (p, c) => h(BreadcrumbLink, p, c)],
    ["CollapsibleTrigger", (p, c) => h(Collapsible, null, h(CollapsibleTrigger, p, c))],
    ["DialogTrigger", (p, c) => h(Dialog, null, h(DialogTrigger, p, c))],
    ["DialogClose", (p, c) => h(Dialog, null, h(DialogClose, p, c))],
    ["DropdownMenuTrigger", (p, c) => h(DropdownMenu, null, h(DropdownMenuTrigger, p, c))],
    ["PopoverTrigger", (p, c) => h(Popover, null, h(PopoverTrigger, p, c))],
    ["SheetTrigger", (p, c) => h(Sheet, null, h(SheetTrigger, p, c))],
    ["TooltipTrigger", (p, c) => h(TooltipProvider, null, h(Tooltip, null, h(TooltipTrigger, p, c)))],
  ];
  for (const [name, part] of parts) {
    const asChild = render(part({ asChild: true }, link("Read guide")));
    // What the CLI writes: the child's props on render, the child's children as the part's.
    assert.equal(render(part({ render: link() }, "Read guide")), asChild, name + ": render differs from asChild");
    // A render element with children of its own and none on the part.
    assert.equal(render(part({ render: link("Read guide") })), asChild, name + ": render with its own children differs");
    assert.match(asChild, /<a /, name + ": not rendered as the link");
  }
  // Button as a link: the CLI adds nativeButton={false}, which never reaches the DOM.
  const button = render(h(Button, { render: link(), nativeButton: false }, "Read guide"));
  assert.equal(button, render(h(Button, { asChild: true }, link("Read guide"))));
  assert.doesNotMatch(button, /nativebutton|nativeButton/i);
  // Without render nothing changes.
  assert.equal(render(h(Button, null, "Save")), render(h(Button, { render: undefined }, "Save")));
  // Negative control: a raw Radix part takes no render, so the comparison can fail.
  const raw = (p, c) => h(TooltipProvider, null, h(Tooltip, null, h(TooltipPrimitive.Trigger, p, c)));
  const silence = console.error;
  console.error = () => undefined;
  try {
    assert.notEqual(render(raw({ render: link() }, "Read guide")), render(raw({ asChild: true }, link("Read guide"))));
  } finally {
    console.error = silence;
  }
  console.log("PASS: render renders what asChild renders on " + parts.length + " parts, with the element's own children, as a Button link without nativeButton in the DOM; the negative control differs.");
`,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  outfile: out,
  alias: { "@rhs-ui": path.join(root, "registry"), "@/lib/utils": path.join(root, "dev", "lib", "utils") },
});
createRequire(out)(out);
