import { QuickstartSteps } from "@rhs-ui/marketing/quickstart-steps";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Choose pnpm, npm, yarn or bun and every command changes, and so does the output of the first step</p>
      <QuickstartSteps
        eyebrow="Quickstart"
        title="From zero to your first payment in five minutes"
        description="Three commands, and a line after each that tells you whether it worked. You need Node 20 or newer and a test key from your dashboard."
        steps={[
          {
            title: "Install the SDK",
            note: "It ships its own types, so there is nothing else to add.",
            command: "npm install @northwind/sdk",
            expected: {
              npm: "added 1 package, and audited 2 packages in 2s",
              pnpm: "dependencies:\n+ @northwind/sdk 4.2.1\n\nDone in 1.8s",
              yarn: "success Saved 1 new dependency.\nDone in 1.92s.",
              bun: "installed @northwind/sdk@4.2.1\n\n 1 package installed [1.20s]",
            },
          },
          {
            title: "Create a test payment",
            command: "npx northwind payments create 25.00 EUR",
            expected: "pay_1Nw8Kx created\namount    €25.00\nstatus    requires_confirmation",
          },
          {
            title: "Listen for the webhook",
            note: "Keep this running while you confirm the payment in the dashboard.",
            command: "npx northwind listen localhost:3000/webhooks",
            expected: "Ready. Forwarding events to http://localhost:3000/webhooks\npayment.created  evt_1Nw8L2  200 OK",
          },
        ]}
        variants={{
          npm: ["npm install @northwind/sdk", "npx northwind payments create 25.00 EUR", "npx northwind listen localhost:3000/webhooks"],
          pnpm: ["pnpm add @northwind/sdk", "pnpm dlx northwind payments create 25.00 EUR", "pnpm dlx northwind listen localhost:3000/webhooks"],
          yarn: ["yarn add @northwind/sdk", "yarn dlx northwind payments create 25.00 EUR", "yarn dlx northwind listen localhost:3000/webhooks"],
          bun: ["bun add @northwind/sdk", "bunx northwind payments create 25.00 EUR", "bunx northwind listen localhost:3000/webhooks"],
        }}
        next={{ label: "Handle webhooks in production", href: "#webhooks" }}
      />

      <p className="mt-20 mb-8 text-xs text-muted-foreground">With no switch and no link on, in a narrow column: the same rail with two steps</p>
      <div className="max-w-xl">
        <QuickstartSteps
          headingLevel={3}
          title="Run it locally with Docker"
          steps={[
            { title: "Pull the image", command: "docker pull northwind/northwind:latest", expected: "Status: Downloaded newer image for northwind/northwind:latest" },
            { title: "Start the server", command: "docker run -p 8080:8080 northwind/northwind", expected: "Listening on http://localhost:8080" },
          ]}
        />
      </div>
    </div>
  );
}
