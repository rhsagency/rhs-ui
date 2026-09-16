import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The flap folds open, the letter rises out, and everything closes again. */
const motion: IconMotion = {
  steps: [
    {
      part: "flap",
      origin: "12px 7.5px",
      duration: 1100,
      easing: "linear",
      keyframes: [
        { transform: "scaleY(1)", easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { offset: 0.28, transform: "scaleY(-1)" },
        { offset: 0.7, transform: "scaleY(-1)", easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
        { transform: "scaleY(1)" },
      ],
    },
    {
      part: "letter",
      duration: 1100,
      easing: "linear",
      keyframes: [
        { transform: "translateY(0)", opacity: 0, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { offset: 0.22, transform: "translateY(0)", opacity: 0 },
        { offset: 0.48, transform: "translateY(-4.5px)", opacity: 1 },
        { offset: 0.66, transform: "translateY(-4.5px)", opacity: 1, easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
        { transform: "translateY(0)", opacity: 0 },
      ],
    },
  ],
  pause: 1400,
};

export function IconMailAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="letter" opacity={0} d="M8 8.5h8v5H8z" />
      <path data-part="body" d="M17.8 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2" />
      <path data-part="flap" d="M3.5 7.5l8.5 6 8.5-6" />
    </AnimatedGlyph>
  );
}
