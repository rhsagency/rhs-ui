import { Button } from "@rhs-ui/primitives/button";
import { ProfileCard } from "@rhs-ui/primitives/profile-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-sm p-8">
      <ProfileCard
        name="Femke Bos"
        role="Product designer, Utrecht"
        bio="Designs onboarding flows and writes about the boring parts of good software."
        stats={[{ label: "Projects", value: "24" }, { label: "Followers", value: "1.2k" }, { label: "Following", value: "180" }]}
        actions={<><Button size="sm" variant="outline">Message</Button><Button size="sm">Follow</Button></>}
      />
    </div>
  );
}
