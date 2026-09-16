import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** A small tilt and a soft pop, returning to the exact authored silhouette. */
const motion: IconMotion = {
  steps: [
    {
      part: "star",
      origin: "12px 11.6px",
      duration: 720,
      easing: "linear",
      keyframes: [
        { transform: "rotate(0deg) scale(1)", easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
        { offset: 0.42, transform: "rotate(-12deg) scale(0.92)", easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { offset: 0.78, transform: "rotate(4deg) scale(1.06)", easing: "ease-in-out" },
        { transform: "rotate(0deg) scale(1)" },
      ],
    },
  ],
  pause: 1200,
};

export function IconStarAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="star" d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
    </AnimatedGlyph>
  );
}
