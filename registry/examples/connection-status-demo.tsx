import { ConnectionStatus } from "@rhs-ui/primitives/connection-status";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 p-10">
      <ConnectionStatus state="connected" detail="Synced just now" />
      <ConnectionStatus state="reconnecting" label="Sync" detail="Changes are kept on this device" />
      <ConnectionStatus state="offline" label="Printer" />
    </div>
  );
}
