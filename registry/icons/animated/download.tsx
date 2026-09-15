import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The arrow drops through the tray and comes back from the top; the tray gives a little. */
const motion: IconMotion = {
  steps: [
    {
      part: "arrow",
      duration: 640,
      easing: "linear",
      keyframes: [
        { transform: "translateY(0)", opacity: 1, easing: "cubic-bezier(0.4, 0, 1, 1)" },
        { offset: 0.4, transform: "translateY(7px)", opacity: 0 },
        { offset: 0.41, transform: "translateY(-7px)", opacity: 0, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { transform: "translateY(0)", opacity: 1 },
      ],
    },
    {
      part: "tray",
      duration: 640,
      easing: "linear",
      keyframes: [
        { transform: "translateY(0)" },
        { offset: 0.3, transform: "translateY(0)", easing: "ease-out" },
        { offset: 0.42, transform: "translateY(1.2px)", easing: "ease-in-out" },
        { offset: 0.7, transform: "translateY(0)" },
        { transform: "translateY(0)" },
      ],
    },
  ],
  pause: 1200,
};

export function IconDownloadAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="arrow" d="M12 4v12M6 10l6 6 6-6" />
      <path data-part="tray" d="M4 20h16" />
    </AnimatedGlyph>
  );
}
