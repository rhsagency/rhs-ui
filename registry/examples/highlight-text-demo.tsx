import { HighlightText } from "@rhs-ui/motion/highlight-text";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-10 text-2xl leading-snug font-medium tracking-[-.02em]">
      <p>
        We build software that is <HighlightText>calm by default</HighlightText> and fast when you need it.
      </p>
      <p>
        Every plan includes <HighlightText variant="block" delay={400}>unlimited guests</HighlightText>.
      </p>
      <p>
        <HighlightText variant="underline" delay={700}>Read the case study</HighlightText> to see how.
      </p>
    </div>
  );
}
