import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** Two beats, the second softer than the first. */
const motion: IconMotion = {
  steps: [
    {
      part: "heart",
      origin: "12px 13px",
      duration: 900,
      easing: "linear",
      keyframes: [
        { transform: "scale(1)", easing: "ease-out" },
        { offset: 0.15, transform: "scale(1.18)", easing: "ease-in" },
        { offset: 0.32, transform: "scale(0.96)", easing: "ease-out" },
        { offset: 0.48, transform: "scale(1.1)", easing: "ease-in-out" },
        { offset: 0.75, transform: "scale(1)" },
        { transform: "scale(1)" },
      ],
    },
  ],
  pause: 900,
};

export function IconHeartAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="heart" d="M12 20.5S3.5 15 3.5 9A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 20.5 9c0 6-8.5 11.5-8.5 11.5z" />
    </AnimatedGlyph>
  );
}
