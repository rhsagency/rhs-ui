import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The lens looks left, then right, and settles: a search in progress. */
const motion: IconMotion = {
  steps: [
    {
      part: "lens",
      origin: "10.5px 10.5px",
      duration: 850,
      easing: "linear",
      keyframes: [
        { transform: "translate(0, 0) rotate(0deg)", easing: "ease-in-out" },
        { transform: "translate(-1.6px, -1.2px) rotate(-8deg)", easing: "ease-in-out" },
        { transform: "translate(1.6px, -1.2px) rotate(8deg)", easing: "ease-in-out" },
        { transform: "translate(0, 0) rotate(0deg)" },
      ],
    },
  ],
  pause: 1200,
};

export function IconSearchAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="lens" d="M16.78 8.82A6.5 6.5 0 1 1 13.55 4.9M20 20l-4.6-4.6" />
    </AnimatedGlyph>
  );
}
