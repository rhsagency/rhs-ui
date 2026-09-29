import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-end gap-6">
        <Spinner size={14} />
        <Spinner size={20} />
        <Spinner size={32} />
      </div>
      <Button variant="outline" disabled>
        <Spinner size={16} label="" /> Deploying to production
      </Button>
    </div>
  );
}
