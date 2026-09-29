import { Label } from "@rhs-ui/primitives/label";
import { PasswordInput } from "@rhs-ui/primitives/password-input";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <div className="grid gap-2">
        <Label htmlFor="current">Current password</Label>
        <PasswordInput id="current" autoComplete="current-password" defaultValue="lighthouse" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new">New password</Label>
        <PasswordInput id="new" autoComplete="new-password" rules defaultValue="Harbour7" />
      </div>
    </div>
  );
}
