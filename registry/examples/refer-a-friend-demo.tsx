import { ReferAFriend } from "@rhs-ui/marketing/refer-a-friend";

const offer = { give: "€20", get: "€20" };
const terms = { href: "#terms", creditTiming: "Credit arrives 14 days after your friend's first payment, so a refund never takes it back." };

// One story in one set of words: a subscription, so "first month" and "next invoice", and the same 14 days as the terms.
const steps = [
  { title: "Share your link", description: "Send it by email or message, or copy it." },
  { title: "They get €20 off", description: "Your friend signs up through your link and the €20 comes off their first month." },
  { title: "You get €20 credit", description: "When their first payment clears, €20 is added to your next invoice, 14 days later." },
];
const message = {
  subject: "€20 off your first month of Halcyon",
  text: "I use Halcyon and think you will like it. Sign up with my link and your first month is €20 cheaper.",
};

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">For signed-in customers: the offer, how it works, a link to copy and share, and their own numbers. Try copy.</p>
      <ReferAFriend
        offer={offer}
        link="https://halcyon.example/r/maria-k4x9"
        stats={{ invited: 12, joined: 5, credit: "€100" }}
        terms={terms}
        steps={steps}
        message={message}
        description="A friend who tries Halcyon through your link gets €20 off their first month. When their first payment clears, you get €20 off your next invoice."
      />

      <div className="mt-20 max-w-xl">
        <p className="mb-8 text-xs text-muted-foreground">In a narrow column, and for a customer who has not shared yet: everything stacks, the link wraps instead of being cut, and the numbers start at zero</p>
        <ReferAFriend headingLevel={3} offer={offer} link="https://halcyon.example/r/tomas-p7r2" stats={{ invited: 0, joined: 0, credit: "€0" }} terms={terms} steps={steps} message={message} />
      </div>
    </div>
  );
}
