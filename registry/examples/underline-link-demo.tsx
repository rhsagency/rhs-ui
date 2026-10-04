import { UnderlineLink } from "@rhs-ui/motion/underline-link";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-5 p-10 text-lg">
      <UnderlineLink href="#">Grow from the left</UnderlineLink>
      <UnderlineLink href="#" effect="center">Grow from the centre</UnderlineLink>
      <UnderlineLink href="#" effect="swap">Leave right, return left</UnderlineLink>
    </div>
  );
}
