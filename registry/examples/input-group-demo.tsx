import { IconAtSign, IconGlobe } from "@rhs-ui/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Label } from "@rhs-ui/primitives/label";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <div className="grid gap-2">
        <Label htmlFor="site">Website</Label>
        <InputGroup>
          <InputGroupAddon>
            <IconGlobe /> https://
          </InputGroupAddon>
          <InputGroupInput id="site" placeholder="studio.example" />
        </InputGroup>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="price">Price</Label>
        <InputGroup>
          <InputGroupAddon>EUR</InputGroupAddon>
          <InputGroupInput id="price" inputMode="decimal" defaultValue="149" />
          <InputGroupAddon>one-time</InputGroupAddon>
        </InputGroup>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="handle">Handle</Label>
        <InputGroup>
          <InputGroupAddon>
            <IconAtSign />
          </InputGroupAddon>
          <InputGroupInput id="handle" defaultValue="ines" />
        </InputGroup>
      </div>
    </div>
  );
}
