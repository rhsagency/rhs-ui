import { IconCalendarPlus, IconFileText } from "@rhs-ui/icons";
import { ThankYouNextSteps } from "@rhs-ui/marketing/thank-you-next-steps";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">After booking a call: what was done, what happens next and when, and two things to do meanwhile. Try the copy button.</p>
      <ThankYouNextSteps
        title="You are booked for Thursday at 14:00"
        summary="We sent the confirmation to maria@halcyon.studio. Thursday's call is 30 minutes with Maya Okafor from our solutions team."
        reference="HAL-48213"
        labels={{ reference: "Booking reference" }}
        steps={[
          { label: "Confirmation email", detail: "It has the calendar invite, the video link and the questions Maya will ask.", when: "Now" },
          { label: "A reminder, with a way to reschedule", detail: "If Thursday stops working, one click moves it. No need to write to us.", when: "Wednesday 14:00" },
          { label: "Your call with Maya", detail: "Join from the link in the invite. She will already have your answers in front of her.", when: "Thursday 14:00" },
        ]}
        actions={
          <>
            <Button variant="outline" size="lg">
              <IconCalendarPlus />
              Add to calendar
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#guide">
                <IconFileText />
                Read the getting-started guide
              </a>
            </Button>
          </>
        }
      />

      <div className="mt-24 border-t border-border pt-14">
        <p className="mb-8 text-xs text-muted-foreground">After an order, without follow-ups: the steps alone, with a different reference name</p>
        <ThankYouNextSteps
          headingLevel={3}
          title="Thank you, your order is in"
          summary="A receipt is on its way to maria@halcyon.studio. Nothing else is needed from you."
          reference="#10482"
          labels={{ reference: "Order number" }}
          steps={[
            { label: "Receipt", detail: "A PDF invoice with your VAT number.", when: "Now" },
            { label: "Your workspace is ready", detail: "Sign in with the address above; your seats are already added.", when: "In 5 minutes" },
          ]}
        />
      </div>
    </div>
  );
}
