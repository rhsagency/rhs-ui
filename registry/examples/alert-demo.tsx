import { IconAlertCircle, IconCheckCircle, IconInfo } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-lg gap-3">
      <Alert tone="info">
        <IconInfo />
        <AlertTitle>Scheduled maintenance</AlertTitle>
        <AlertDescription>Checkout is read-only on Sunday between 02:00 and 03:00 CET.</AlertDescription>
      </Alert>
      <Alert tone="success">
        <IconCheckCircle />
        <AlertTitle>Domain connected</AlertTitle>
        <AlertDescription>rhsui.com now points at your production deployment.</AlertDescription>
      </Alert>
      <Alert tone="warning">
        <IconAlertCircle />
        <AlertTitle>Two seats left</AlertTitle>
        <AlertDescription>Invite anyone else and the team moves to the next plan.</AlertDescription>
      </Alert>
      <Alert tone="destructive" role="alert">
        <IconAlertCircle />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Your card was declined. Update it before 3 October to keep access.</AlertDescription>
      </Alert>
    </div>
  );
}
