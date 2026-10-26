import type { ReactNode } from "react";

import { Callout } from "@rhs-ui/primitives/callout";
import { CodeBlock } from "@rhs-ui/primitives/code-block";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Step, StepList } from "@rhs-ui/primitives/step-list";

/** Code inside a sentence. */
function InlineCode({ children }: { children: ReactNode }): React.JSX.Element {
  return <code className="rounded-[0.35em] border border-border bg-muted px-[0.4em] py-[0.1em] font-mono text-[0.875em] font-normal text-foreground">{children}</code>;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

// A drawn screenshot of the finished result, so the demo needs no image file.
const SCREEN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 300'>
      <rect width='640' height='300' fill='#f4f4f4'/>
      <rect width='640' height='38' fill='#e4e4e4'/>
      <circle cx='22' cy='19' r='5' fill='#c2c2c2'/><circle cx='40' cy='19' r='5' fill='#c2c2c2'/><circle cx='58' cy='19' r='5' fill='#c2c2c2'/>
      <rect x='190' y='10' width='260' height='18' rx='9' fill='#fafafa'/>
      <rect x='206' y='16' width='120' height='6' rx='3' fill='#c9c9c9'/>
      <rect x='18' y='56' width='118' height='226' rx='10' fill='#ebebeb'/>
      <text x='34' y='84' font-family='Arial, sans-serif' font-size='15' font-weight='700' fill='#1c1c1c'>Halcyon</text>
      <rect x='34' y='108' width='72' height='8' rx='4' fill='#1c1c1c'/>
      <rect x='34' y='134' width='86' height='8' rx='4' fill='#bdbdbd'/>
      <rect x='34' y='160' width='60' height='8' rx='4' fill='#bdbdbd'/>
      <rect x='34' y='186' width='78' height='8' rx='4' fill='#bdbdbd'/>
      <rect x='156' y='56' width='200' height='16' rx='8' fill='#1c1c1c'/>
      <rect x='156' y='86' width='146' height='74' rx='10' fill='#fff' stroke='#dcdcdc'/>
      <rect x='312' y='86' width='146' height='74' rx='10' fill='#fff' stroke='#dcdcdc'/>
      <rect x='468' y='86' width='154' height='74' rx='10' fill='#fff' stroke='#dcdcdc'/>
      <rect x='170' y='102' width='50' height='7' rx='3.5' fill='#bdbdbd'/><rect x='170' y='122' width='78' height='18' rx='6' fill='#1c1c1c'/>
      <rect x='326' y='102' width='50' height='7' rx='3.5' fill='#bdbdbd'/><rect x='326' y='122' width='64' height='18' rx='6' fill='#1c1c1c'/>
      <rect x='482' y='102' width='50' height='7' rx='3.5' fill='#bdbdbd'/><rect x='482' y='122' width='88' height='18' rx='6' fill='#1c1c1c'/>
      <rect x='156' y='176' width='466' height='106' rx='10' fill='#fff' stroke='#dcdcdc'/>
      <path d='M176 258 L236 230 L296 244 L366 204 L436 218 L506 190 L600 200' fill='none' stroke='#1c1c1c' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/>
    </svg>`,
  );

const CONFIG = `/** @type {import("@halcyon/cli").Config} */
export default {
  workspace: "northwind",
  outDir: ".halcyon",
};`;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-12">
      <Example caption="A tutorial: a title, and any content inside each step. The hairline stops after the last one">
        <h2 className="max-w-xl text-xl font-semibold tracking-[-0.03em]">Set up the Halcyon CLI</h2>
        <StepList className="max-w-xl">
          <Step id="install" title="Install the CLI">
            <p>Add the package to your project with the package manager you already use.</p>
            <CodeBlock language="bash" code="pnpm add -D @halcyon/cli" />
          </Step>
          <Step id="configure" title="Create the config file">
            <p>
              Run <InlineCode>pnpm halcyon init</InlineCode>. It writes <InlineCode>halcyon.config.ts</InlineCode> and asks which workspace to connect.
            </p>
            <CodeBlock filename="halcyon.config.ts" code={CONFIG} />
          </Step>
          <Step id="run" title="Start the dev server">
            <p>
              Run <InlineCode>pnpm halcyon dev</InlineCode> and open <InlineCode>http://localhost:4321</InlineCode>. To stop it, press{" "}
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>C</Kbd>
              </KbdGroup>
              .
            </p>
          </Step>
          <Step id="check" title="Check that it works">
            <p>You should see the Northwind workspace, with its three projects in the overview.</p>
            <img src={SCREEN} alt="The Halcyon overview with three project cards and a usage chart" width={640} height={300} className="h-auto w-full rounded-lg border border-border" />
            <Callout tone="tip" title="Seeing an empty workspace?">
              Check that <InlineCode>workspace</InlineCode> in the config matches the slug in your dashboard URL.
            </Callout>
          </Step>
        </StepList>
      </Example>

      <div className="grid gap-12 sm:grid-cols-2">
        <Example caption="summaryOnly folds every step to its title: an overview for the top of a guide">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-4 text-sm font-medium">In this guide</h2>
            <StepList size="sm" summaryOnly>
              <Step as="p" title="Install the CLI">
                <p>Hidden in the summary.</p>
              </Step>
              <Step as="p" title="Create the config file">
                <p>Hidden in the summary.</p>
              </Step>
              <Step as="p" title="Start the dev server">
                <p>Hidden in the summary.</p>
              </Step>
              <Step as="p" title="Check that it works">
                <p>Hidden in the summary.</p>
              </Step>
            </StepList>
          </div>
        </Example>

        <Example caption="start continues a guide: here at 5, in the small size, with short steps">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-4 text-sm font-medium">Next steps</h2>
            <StepList size="sm" start={5}>
              <Step as="h3" title="Add authentication">
                <p>Connect your identity provider so people sign in with the accounts they already have.</p>
              </Step>
              <Step as="h3" title="Deploy to production">
                <p>
                  Run <InlineCode>pnpm halcyon deploy</InlineCode> from your main branch.
                </p>
              </Step>
            </StepList>
          </div>
        </Example>
      </div>
    </div>
  );
}
