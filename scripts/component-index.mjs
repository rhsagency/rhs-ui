// The rich part of the component index (public/r/component-index.json, see
// component-index-file.mjs): per Free item its import path, its exported
// components with their props and the JSDoc the library writes on every prop,
// a usage example taken from the item's own demo, and what it depends on. Read
// from the item source with the TypeScript compiler API, so it says what the
// code says.
//
// Written for RHS Orbit's builder (its get_component and search_components
// answer from it) and moved here on 2026-11-04, so a tool reads a published
// file of a release instead of this repository's source.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

const USAGE_MAX_LINES = 90;
const USAGE_MAX_CHARS = 5_000;
const TYPE_MAX_CHARS = 160;
const DOC_MAX_CHARS = 900;
const FREE_URL = /^https:\/\/rhsui\.com\/r\/([a-z0-9-]+)\.json$/;

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const oneLine = (text) => text.replace(/\s+/g, " ").trim();

/** The JSDoc text written directly above a node, without tags. */
function jsDocOf(node) {
  const docs = ts.getJSDocCommentsAndTags(node).filter((doc) => ts.isJSDoc(doc));
  const text = docs.map((doc) => (typeof doc.comment === "string" ? doc.comment : (doc.comment ?? []).map((part) => part.text ?? "").join(""))).join(" ");
  return oneLine(text);
}

function isExported(statement) {
  return (ts.canHaveModifiers(statement) ? ts.getModifiers(statement) ?? [] : []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

/** Members of an interface or an object type literal, with their docs. */
function membersOf(declaration, source) {
  const members = ts.isInterfaceDeclaration(declaration) ? declaration.members : ts.isTypeAliasDeclaration(declaration) && ts.isTypeLiteralNode(declaration.type) ? declaration.type.members : [];
  const props = [];
  for (const member of members) {
    if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member)) continue;
    if (!member.name) continue;
    const type = member.type ? oneLine(member.type.getText(source)) : ts.isMethodSignature(member) ? "function" : "unknown";
    props.push({ name: member.name.getText(source).replace(/^["']|["']$/g, ""), type: clip(type, TYPE_MAX_CHARS), optional: Boolean(member.questionToken), doc: jsDocOf(member) });
  }
  return props;
}

/** What a props type builds on: `extends Omit<ComponentProps<"section">, "children">` or an intersection. */
function extendsOf(declaration, source) {
  if (ts.isInterfaceDeclaration(declaration)) {
    const clauses = (declaration.heritageClauses ?? []).flatMap((clause) => clause.types.map((type) => oneLine(type.getText(source))));
    return clauses.length ? clip(clauses.join(", "), TYPE_MAX_CHARS) : null;
  }
  if (ts.isTypeAliasDeclaration(declaration) && !ts.isTypeLiteralNode(declaration.type)) return clip(oneLine(declaration.type.getText(source)), TYPE_MAX_CHARS);
  return null;
}

/** The exported names of one source file, and per exported component its props. */
export function readSource(text, fileName) {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const types = new Map();
  const exported = [];
  for (const statement of source.statements) {
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) types.set(statement.name.text, statement);
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) if (!statement.isTypeOnly && !element.isTypeOnly) exported.push({ name: element.name.text, node: null, doc: "" });
      continue;
    }
    if (!isExported(statement)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) exported.push({ name: statement.name.text, node: statement, doc: jsDocOf(statement) });
    else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) exported.push({ name: declaration.name.text, node: declaration, doc: jsDocOf(statement) });
    } else if (ts.isClassDeclaration(statement) && statement.name) exported.push({ name: statement.name.text, node: statement, doc: jsDocOf(statement) });
  }

  const components = [];
  const helpers = [];
  for (const entry of exported) {
    if (!/^[A-Z]/.test(entry.name)) {
      helpers.push(entry.name);
      continue;
    }
    // The props type: the annotation on the first parameter of a function component.
    let fn = entry.node;
    if (fn && ts.isVariableDeclaration(fn) && fn.initializer && (ts.isArrowFunction(fn.initializer) || ts.isFunctionExpression(fn.initializer))) fn = fn.initializer;
    const param = fn && (ts.isFunctionDeclaration(fn) || ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) ? fn.parameters[0] : undefined;
    const annotation = param?.type;
    let props = [];
    let base = null;
    let propsType = null;
    if (annotation && ts.isTypeReferenceNode(annotation)) {
      propsType = annotation.typeName.getText(source);
      const declaration = types.get(propsType);
      if (declaration) {
        props = membersOf(declaration, source);
        base = extendsOf(declaration, source);
      } else base = clip(oneLine(annotation.getText(source)), TYPE_MAX_CHARS);
    } else if (annotation) {
      base = clip(oneLine(annotation.getText(source)), TYPE_MAX_CHARS);
    }
    components.push({ name: entry.name, summary: clip(entry.doc, DOC_MAX_CHARS), propsType, extends: base, props });
  }
  return { components, helpers, types: [...types.keys()].filter((name) => text.includes(`export interface ${name}`) || text.includes(`export type ${name}`)) };
}

/** A demo, trimmed to what shows the item in use: its imports from RHS UI and the first lines of JSX. */
export function usageFrom(demo) {
  const lines = demo
    .replace(/^"use client";\s*/m, "")
    .split("\n")
    .filter((line) => !/^import .* from "(react|next\/[^"]+)";$/.test(line.trim()));
  let text = lines.slice(0, USAGE_MAX_LINES).join("\n").trim();
  if (lines.length > USAGE_MAX_LINES) text += "\n// … (the demo continues)";
  return clip(text, USAGE_MAX_CHARS);
}

/** The import path a project uses for an item's main file: "@rhs-ui/marketing/about-story". */
export function importPathOf(target) {
  const inside = target.replace(/^components\/rhs-ui\//, "").replace(/\.(tsx|ts)$/, "").replace(/\/index$/, "");
  return `@rhs-ui/${inside}`;
}

/**
 * The rich index for the items of the compact catalogue. Fails (throws) on an
 * item the generator could not use: no source file, no export, a dependency
 * that is not a Free item, or no description. A planted bad item must fail it.
 */
export function buildIndex({ registryRoot, registryItems, names }) {
  const byName = new Map(registryItems.map((item) => [item.name, item]));
  const entries = [];
  const problems = [];
  for (const name of names) {
    const item = byName.get(name);
    if (!item) {
      problems.push(`${name}: not in the registry`);
      continue;
    }
    const files = (item.files ?? []).filter((file) => file.target);
    if (!files.length) {
      problems.push(`${name}: no installable file`);
      continue;
    }
    const main = files.find((file) => path.basename(file.target).replace(/\.(tsx|ts)$/, "") === name) ?? files.find((file) => /\/index\.tsx?$/.test(file.target)) ?? files[0];
    const sourcePath = path.join(registryRoot, main.path);
    if (!existsSync(sourcePath)) {
      problems.push(`${name}: source ${main.path} is missing`);
      continue;
    }
    const read = readSource(readFileSync(sourcePath, "utf8"), main.path);
    if (!read.components.length && !read.helpers.length) {
      problems.push(`${name}: ${main.path} exports nothing`);
      continue;
    }
    const registryDependencies = [];
    for (const dependency of item.registryDependencies ?? []) {
      const match = FREE_URL.exec(dependency);
      if (!match) problems.push(`${name}: registry dependency ${dependency} is not a Free item`);
      else registryDependencies.push(match[1]);
    }
    const description = oneLine(String(item.description ?? ""));
    if (!description) problems.push(`${name}: no description`);
    const demoPath = path.join(registryRoot, "registry", "examples", `${name}-demo.tsx`);
    entries.push({
      name,
      title: item.title ?? name,
      description,
      importPath: importPathOf(main.target),
      files: files.map((file) => file.target),
      components: read.components,
      helpers: read.helpers,
      types: read.types,
      usage: existsSync(demoPath) ? usageFrom(readFileSync(demoPath, "utf8")) : null,
      docs: item.docs ? clip(oneLine(item.docs), DOC_MAX_CHARS) : null,
      registryDependencies,
      dependencies: item.dependencies ?? [],
    });
  }
  if (problems.length) throw new Error(`component index: ${problems.length} problem(s)\n${problems.slice(0, 20).join("\n")}`);
  return entries;
}
