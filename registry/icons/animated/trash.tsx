import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The lid lifts from its left hinge and drops shut. */
const motion: IconMotion = {
  steps: [
    {
      part: "lid",
      origin: "4px 7px",
      duration: 820,
      easing: "linear",
      keyframes: [
        { transform: "translateY(0) rotate(0deg)", easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { offset: 0.35, transform: "translateY(-2px) rotate(-14deg)", easing: "ease-in-out" },
        { offset: 0.6, transform: "translateY(-1.5px) rotate(-11deg)", easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
        { offset: 0.82, transform: "translateY(0) rotate(0deg)", easing: "ease-out" },
        { offset: 0.9, transform: "translateY(-0.4px) rotate(-1.5deg)", easing: "ease-in" },
        { transform: "translateY(0) rotate(0deg)" },
      ],
    },
  ],
  pause: 1400,
};

export function IconTrashAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="lid" d="M4 7h16M9 7V4h6v3" />
      <path data-part="bin" d="M6 7l1 14h10l1-14M10 11v6M14 11v6" />
    </AnimatedGlyph>
  );
}
