import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The arrow leaves through the door and comes back in behind it. */
const motion: IconMotion = {
  steps: [
    {
      part: "arrow",
      duration: 620,
      easing: "linear",
      keyframes: [
        { transform: "translateX(0)", opacity: 1, easing: "cubic-bezier(0.4, 0, 1, 1)" },
        { offset: 0.42, transform: "translateX(5px)", opacity: 0 },
        { offset: 0.43, transform: "translateX(-5px)", opacity: 0, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { transform: "translateX(0)", opacity: 1 },
      ],
    },
    {
      part: "door",
      origin: "4px 12px",
      duration: 620,
      easing: "linear",
      keyframes: [
        { transform: "scaleX(1)" },
        { offset: 0.35, transform: "scaleX(0.94)", easing: "ease-in-out" },
        { offset: 0.8, transform: "scaleX(1)" },
        { transform: "scaleX(1)" },
      ],
    },
  ],
  pause: 1200,
};

export function IconLogOutAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="door" d="M9.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3.5" />
      <path data-part="arrow" d="M16 16l4-4-4-4M20 12H9.5" />
    </AnimatedGlyph>
  );
}
