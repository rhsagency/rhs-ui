import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The arrow leaves on the right and comes back in from the left. */
const motion: IconMotion = {
  steps: [
    {
      part: "arrow",
      duration: 560,
      easing: "linear",
      keyframes: [
        { transform: "translateX(0)", opacity: 1, easing: "cubic-bezier(0.4, 0, 1, 1)" },
        { offset: 0.42, transform: "translateX(8px)", opacity: 0 },
        { offset: 0.43, transform: "translateX(-8px)", opacity: 0, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { transform: "translateX(0)", opacity: 1 },
      ],
    },
  ],
  pause: 1000,
};

export function IconArrowRightAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="arrow" d="M4 12h15M13 6l6 6-6 6" />
    </AnimatedGlyph>
  );
}
