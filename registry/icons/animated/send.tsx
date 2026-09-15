import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The plane flies off to the top right and glides back in from the bottom left. */
const motion: IconMotion = {
  steps: [
    {
      part: "plane",
      duration: 700,
      easing: "linear",
      keyframes: [
        { transform: "translate(0, 0)", opacity: 1, easing: "cubic-bezier(0.4, 0, 1, 1)" },
        { offset: 0.4, transform: "translate(9px, -9px)", opacity: 0 },
        { offset: 0.41, transform: "translate(-9px, 9px)", opacity: 0, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { transform: "translate(0, 0)", opacity: 1 },
      ],
    },
  ],
  pause: 1200,
};

export function IconSendAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="plane" d="M21 3L10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z" />
    </AnimatedGlyph>
  );
}
