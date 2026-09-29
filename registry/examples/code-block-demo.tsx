import { CodeBlock } from "@rhs-ui/primitives/code-block";

const CODE = `import { Button } from "@/components/rhs-ui/primitives/button";

export default function Page() {
  return (
    <Button size="lg">
      Start building
    </Button>
  );
}`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-xl gap-4">
      <CodeBlock language="bash" code="npx shadcn@latest add https://rhsui.com/r/button.json" />
      <CodeBlock filename="app/page.tsx" code={CODE} showLineNumbers highlight={[5, 6, 7]} />
    </div>
  );
}
