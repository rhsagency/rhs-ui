import { SdkGrid } from "@rhs-ui/marketing/sdk-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Seven libraries and a card for community ones; each status is a word with its own shape</p>
      <SdkGrid
        eyebrow="Libraries"
        title="Use Northwind from your own stack"
        description="Official libraries wrap the same API, ship their own types and follow the same version of it. Pick yours and have the first call working in a minute."
        communityHref="#community-libraries"
        sdks={[
          { id: "ts", label: "TypeScript", install: "npm install @northwind/sdk", version: "4.2.1", status: "stable", docsHref: "#docs-typescript", sourceHref: "#source-typescript" },
          { id: "py", label: "Python", install: "pip install northwind", version: "3.8.0", status: "stable", docsHref: "#docs-python", sourceHref: "#source-python" },
          { id: "go", label: "Go", install: "go get github.com/northwind/northwind-go/v2", version: "2.5.3", status: "stable", docsHref: "#docs-go", sourceHref: "#source-go" },
          { id: "rb", label: "Ruby", install: "gem install northwind", version: "1.9.2", status: "stable", docsHref: "#docs-ruby", sourceHref: "#source-ruby" },
          { id: "php", label: "PHP", install: "composer require northwind/northwind-php", version: "3.1.0", status: "stable", docsHref: "#docs-php", sourceHref: "#source-php" },
          { id: "dart", label: "Dart", install: "dart pub add northwind", version: "0.8.0", status: "beta", docsHref: "#docs-dart", sourceHref: "#source-dart" },
          { id: "ex", label: "Elixir", install: '{:northwind, "~> 0.9"}', version: "0.9.4", status: "community", docsHref: "#docs-elixir", sourceHref: "#source-elixir" },
        ]}
      />

      <p className="mt-20 mb-8 text-xs text-muted-foreground">A narrow column with no community card: a command too long for its line wraps, and its button drops under it</p>
      <div className="max-w-md">
        <SdkGrid
          headingLevel={3}
          title="Server libraries"
          sdks={[
            { id: "js", label: "JavaScript", install: "npm install @northwind/sdk", version: "4.2.1", status: "stable", docsHref: "#docs-javascript", sourceHref: "#source-javascript" },
            { id: "go2", label: "Go", install: "go get github.com/northwind/northwind-go/v2", version: "2.5.3", status: "stable", docsHref: "#docs-go-2", sourceHref: "#source-go-2" },
          ]}
        />
      </div>
    </div>
  );
}
