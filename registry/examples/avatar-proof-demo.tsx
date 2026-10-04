import { Button } from "@rhs-ui/primitives/button";
import { AvatarProof } from "@rhs-ui/marketing/avatar-proof";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 p-10">
      <Button size="lg">Start for free</Button>
      <AvatarProof
        rating={4.9}
        label="Loved by 12,000 designers"
        people={[{ name: "Sara Haddad" }, { name: "Luca Romano" }, { name: "Mei Tanaka" }, { name: "Daan Peters" }, { name: "Anouk de Wit" }]}
      />
    </div>
  );
}
