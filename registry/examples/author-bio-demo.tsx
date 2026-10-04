import { Button } from "@rhs-ui/primitives/button";
import { AuthorBio } from "@rhs-ui/marketing/author-bio";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <AuthorBio
        name="Anouk de Wit"
        role="Editor, Field Notes"
        bio="Anouk writes about how small teams organise their work. Before Field Notes she ran operations at a 40-person design studio in Rotterdam."
        links={[{ label: "Profile", href: "#anouk" }, { label: "All posts by Anouk", href: "#posts" }, { label: "Newsletter", href: "#newsletter" }]}
        action={<Button size="sm" variant="outline">Follow</Button>}
      />
    </div>
  );
}
