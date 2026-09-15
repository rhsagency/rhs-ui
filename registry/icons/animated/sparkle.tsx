import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The large star turns a quarter and lands on itself; the small one pops back in. */
const motion: IconMotion = {
  steps: [
    {
      part: "large",
      origin: "12px 10px",
      duration: 720,
      keyframes: [
        { transform: "rotate(0deg) scale(1)" },
        { offset: 0.45, transform: "rotate(45deg) scale(0.8)" },
        { transform: "rotate(90deg) scale(1)" },
      ],
    },
    {
      part: "small",
      origin: "18.5px 19.5px",
      duration: 720,
      delay: 90,
      easing: "linear",
      keyframes: [
        { transform: "scale(1)", opacity: 1, easing: "ease-in" },
        { offset: 0.28, transform: "scale(0)", opacity: 0, easing: "ease-out" },
        { offset: 0.7, transform: "scale(1.35)", opacity: 1, easing: "ease-in-out" },
        { transform: "scale(1)", opacity: 1 },
      ],
    },
  ],
  pause: 1400,
};

export function IconSparkleAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="large" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path data-part="small" d="M18.5 16.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </AnimatedGlyph>
  );
}
