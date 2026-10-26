import type { ReactNode } from "react";

import { CodeTabs, CodeTabsProvider, type CodeTab } from "@rhs-ui/primitives/code-tabs";

/** Code inside a sentence. */
function InlineCode({ children }: { children: ReactNode }): React.JSX.Element {
  return <code className="rounded-[0.35em] border border-border bg-muted px-[0.4em] py-[0.1em] font-mono text-[0.875em] font-normal text-foreground">{children}</code>;
}

function Section({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 gap-4">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      {children}
    </section>
  );
}

const INSTALL: readonly CodeTab[] = [
  { id: "npm", label: "npm", language: "bash", code: "npm install @halcyon/ui" },
  { id: "pnpm", label: "pnpm", language: "bash", code: "pnpm add @halcyon/ui" },
  { id: "yarn", label: "yarn", language: "bash", code: "yarn add @halcyon/ui" },
  { id: "bun", label: "bun", language: "bash", code: "bun add @halcyon/ui" },
];

const RUN: readonly CodeTab[] = [
  { id: "npm", label: "npm", language: "bash", code: "npm run dev" },
  { id: "pnpm", label: "pnpm", language: "bash", code: "pnpm dev" },
  { id: "yarn", label: "yarn", language: "bash", code: "yarn dev" },
  { id: "bun", label: "bun", language: "bash", code: "bun dev" },
];

const REQUEST: readonly CodeTab[] = [
  {
    id: "curl",
    label: "cURL",
    language: "bash",
    code: `curl https://api.halcyon.example/v1/invoices \\
  -H "Authorization: Bearer $HALCYON_KEY" \\
  -H "Idempotency-Key: inv-2026-10-0418" \\
  -d customer=cus_8Hq2xN9v \\
  -d amount=4280 \\
  -d currency=eur \\
  -d description="Retainer, October"`,
  },
  {
    id: "node",
    label: "JavaScript",
    language: "js",
    code: `import { halcyon } from "@/lib/halcyon";

const invoice = await halcyon.invoices.create({
  customer: "cus_8Hq2xN9v",
  amount: 4280,
  currency: "eur",
  description: "Retainer, October",
});`,
  },
  {
    id: "python",
    label: "Python",
    language: "python",
    code: `import halcyon

client = halcyon.Client()
invoice = client.invoices.create(
    customer="cus_8Hq2xN9v",
    amount=4280,
    currency="eur",
    description="Retainer, October",
)`,
  },
];

const FILES: readonly CodeTab[] = [
  {
    id: "layout",
    label: "layout.tsx",
    filename: "app/layout.tsx",
    code: `import { HalcyonProvider } from "@/components/halcyon-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HalcyonProvider workspace="northwind">{children}</HalcyonProvider>
      </body>
    </html>
  );
}`,
  },
  {
    id: "page",
    label: "page.tsx",
    filename: "app/page.tsx",
    code: `import { InvoiceTable } from "@/components/invoice-table";

export default function Page() {
  return <InvoiceTable status="open" />;
}`,
  },
  {
    id: "env",
    label: ".env.local",
    filename: ".env.local",
    code: `HALCYON_KEY=hk_test_replace_me
HALCYON_WORKSPACE=northwind`,
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <CodeTabsProvider>
      <div className="mx-auto grid w-full max-w-3xl gap-14 px-4 py-14 sm:px-6">
        <Section title="Install the package">
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Pick your package manager once. Every snippet on the page follows, and the choice is still there the next time you visit.
          </p>
          <CodeTabs tabs={INSTALL} group="package-manager" storageKey="rhs-ui-demo-package-manager" label="Package manager" />
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Then start the dev server and open <InlineCode>http://localhost:4321</InlineCode>. This one switched with the block above.
          </p>
          <CodeTabs tabs={RUN} group="package-manager" storageKey="rhs-ui-demo-package-manager" label="Package manager" />
        </Section>

        <Section title="Create an invoice">
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">The same request in three languages. The panels keep the height of the tallest, so nothing below moves when you switch.</p>
          <CodeTabs tabs={REQUEST} group="language" label="Language" />
        </Section>

        <Section title="Wire it into your app">
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">Tabs can also be files. The name of the file is in the header of the code.</p>
          <CodeTabs tabs={FILES} label="Files" />
        </Section>
      </div>
    </CodeTabsProvider>
  );
}
