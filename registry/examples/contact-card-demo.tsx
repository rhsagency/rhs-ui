import { Button } from "@rhs-ui/primitives/button";
import { ContactCard } from "@rhs-ui/primitives/contact-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-sm p-8">
      <ContactCard
        name="Sara Haddad"
        role="Head of Support"
        company="Northwind"
        email="sara@example.com"
        phone="+31 20 123 4567"
        location="Amsterdam, Netherlands"
        actions={<><Button size="sm">Message</Button><Button size="sm" variant="outline">View deals</Button></>}
      />
    </div>
  );
}
