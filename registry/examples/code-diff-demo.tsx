import { CodeDiff } from "@rhs-ui/primitives/code-diff";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <CodeDiff
        filename="src/lib/export.ts"
        before={`export async function exportRows(query) {\n  const rows = await db.select(query).limit(10000);\n  return toCsv(rows);\n}`}
        after={`export async function exportRows(query) {\n  // Stream in pages, so large exports never time out.\n  const pages = db.select(query).paginate(5000);\n  return toCsvStream(pages);\n}`}
      />
    </div>
  );
}
