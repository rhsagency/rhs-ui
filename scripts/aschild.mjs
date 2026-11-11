/**
 * asChild in a Base UI project. The shadcn CLI installs into Radix and Base UI projects alike, and in a Base UI one (a
 * `base-` style, the default since shadcn 4) it rewrites every asChild attribute in the files it installs: onto Base
 * UI's `render` prop when the child is an element, and away altogether when it is not, which leaves a button around a
 * button. An install into a fresh Base UI project gave 41 type errors on 2026-11-11, and the parts it would have kept
 * compiling were nested buttons.
 *
 * So every asChild attribute in a file the CLI installs (demos included) must survive that rewrite:
 *  - its child is an element, and the part takes `render` (its parameter is typed `& RenderProp`, see render-prop.ts);
 *  - otherwise it is a spread, `{...AS_CHILD}` or `{...{ asChild: value }}`, which the CLI leaves alone.
 * A Radix part itself never takes `render`, and a valued asChild would become `render` whatever its value.
 *
 * Used by scripts/check-registry.mjs, with negative controls, and by any registry built on these parts.
 */
import { createRequire } from "node:module";

const ts = createRequire(import.meta.url)("typescript");

/** The components that take Base UI's render prop: exported functions whose parameter is typed `& RenderProp`. */
export function renderReady(sources) {
  const ready = new Set();
  for (const text of sources.values()) for (const m of text.matchAll(/export function (\w+)\(input: [^)]*?& RenderProp\)/g)) ready.add(m[1]);
  return ready;
}

/** Every asChild attribute in these sources that the CLI's rewrite would break, as `file:line <Tag>: why`. */
export function asChildProblems(sources, ready) {
  const problems = [];
  for (const [file, text] of sources) {
    if (!file.endsWith(".tsx") || !text.includes("asChild")) continue;
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node) => {
      if (ts.isJsxElement(node)) {
        const attr = node.openingElement.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText(source) === "asChild");
        if (attr) {
          const tag = node.openingElement.tagName.getText(source);
          const where = `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1} <${tag}>`;
          const elementChild = node.children.some((c) => ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c));
          if (attr.initializer) problems.push(`${where}: a valued asChild becomes render in a Base UI project whatever its value; write {...{ asChild: value }}`);
          else if (/Primitive\.|^Slot\b/.test(tag)) problems.push(`${where}: a Radix part does not take render; write {...AS_CHILD}`);
          else if (!elementChild) problems.push(`${where}: without an element child the CLI drops asChild in a Base UI project; write {...AS_CHILD}`);
          else if (!ready.has(tag)) problems.push(`${where}: ${tag} does not take render, which the CLI writes here in a Base UI project; give it renderAs (render-prop.ts)`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return problems;
}

/** Negative controls: every way the rewrite breaks a part is caught, and the two safe forms pass. */
export function asChildSelfTests() {
  const ready = renderReady(new Map([["ready.tsx", "export function TooltipTrigger(input: ComponentProps<typeof X> & RenderProp) {}"]]));
  const count = (code) => asChildProblems(new Map([["planted.tsx", code]]), ready).length;
  return [
    ["asChild without an element child", count("const a = <TooltipTrigger asChild>{children}</TooltipTrigger>;") === 1],
    ["asChild on a Radix part", count("const a = <AccordionPrimitive.Header asChild><h3 /></AccordionPrimitive.Header>;") === 1],
    ["asChild on a part that does not take render", count("const a = <Mystery asChild><a href='#' /></Mystery>;") === 1],
    ["a valued asChild", count("const a = <TooltipTrigger asChild={open}><button /></TooltipTrigger>;") === 1],
    ["the two safe forms", count("const a = <><TooltipTrigger asChild><button /></TooltipTrigger><TooltipTrigger {...AS_CHILD}>{children}</TooltipTrigger></>;") === 0],
    ["a render-ready part is recognised", ready.has("TooltipTrigger") && !ready.has("Mystery")],
  ];
}
