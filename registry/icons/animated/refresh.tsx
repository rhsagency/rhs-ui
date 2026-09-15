import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** One full turn, eased in and out. As `trigger="loop"` it is a sync in progress. */
const motion: IconMotion = {
  steps: [
    {
      part: "arrow",
      origin: "12px 12px",
      duration: 800,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      keyframes: [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    },
  ],
  pause: 250,
};

export function IconRefreshAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="arrow" d="M20 12a8 8 0 1 1-2.34-5.66M17.66 2.84v3.5h-3.5" />
    </AnimatedGlyph>
  );
}
