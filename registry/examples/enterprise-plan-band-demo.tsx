import { IconFileSignature, IconHeadphones, IconShieldCheck } from "@rhs-ui/icons";
import { EnterprisePlanBand } from "@rhs-ui/marketing/enterprise-plan-band";
import { Button } from "@rhs-ui/primitives/button";

const capabilities = [
  { icon: <IconShieldCheck />, label: "SSO and SCIM", description: "Okta, Entra ID and Google Workspace, with automatic deprovisioning." },
  { icon: <IconFileSignature />, label: "Custom contracts and invoicing", description: "Purchase orders, net 60 terms and your security addendum." },
  { icon: <IconHeadphones />, label: "A named support engineer", description: "Someone who knows your setup, with a four-hour reply on critical issues." },
];

const contact = { email: "sales@halcyon.example", phone: "+1 (415) 555-0142" };

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-6 text-xs text-muted-foreground">Under the plan cards, full width: the capabilities in three columns, the line to sales on the right</p>
      <EnterprisePlanBand
        title="Need something bigger?"
        description="Larger teams buy differently. Enterprise comes with the security review, the paperwork and the person to call that a procurement team expects."
        capabilities={capabilities}
        contact={contact}
        note="Usually teams of 200 or more"
        action={<Button size="lg">Talk to sales</Button>}
      />

      <div className="mt-16 max-w-md border-t border-border pt-10">
        <p className="mb-6 text-xs text-muted-foreground">In a narrow column, and on a phone: one column, with the button before the list</p>
        <EnterprisePlanBand
          headingLevel={3}
          title="Running a larger team?"
          description="Enterprise adds the security review, the paperwork and one person to call."
          capabilities={capabilities.slice(0, 2)}
          contact={{ email: "sales@halcyon.example" }}
          note="Usually teams of 200 or more"
          action={<Button size="lg">Talk to sales</Button>}
        />
      </div>
    </div>
  );
}
