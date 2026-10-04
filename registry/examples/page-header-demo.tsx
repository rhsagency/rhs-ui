import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { PageHeader } from "@rhs-ui/primitives/page-header";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <PageHeader
        titleAs="h2"
        title="Invoices"
        description="Everything you billed this year, with what is still open."
        breadcrumbs={[{ label: "Finance", href: "#" }, { label: "Invoices" }]}
        meta={<Badge variant="secondary">12 open</Badge>}
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button>New invoice</Button>
          </>
        }
      />
    </div>
  );
}
