import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The gear turns one tooth and settles; the hub stays where it is. */
const motion: IconMotion = {
  steps: [
    {
      part: "gear",
      origin: "12px 12px",
      duration: 760,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      keyframes: [{ transform: "rotate(0deg)" }, { offset: 0.55, transform: "rotate(28deg)" }, { transform: "rotate(0deg)" }],
    },
    {
      part: "hub",
      origin: "12px 12px",
      duration: 760,
      easing: "linear",
      keyframes: [
        { transform: "scale(1)", easing: "ease-out" },
        { offset: 0.3, transform: "scale(0.86)", easing: "ease-in-out" },
        { offset: 0.75, transform: "scale(1)" },
        { transform: "scale(1)" },
      ],
    },
  ],
  pause: 1200,
};

export function IconSettingsAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path
        data-part="gear"
        d="M9.89 5.11l.46-2.47h3.3l.46 2.47a7.2 7.2 0 0 1 2.8 1.62l2.37-.84 1.65 2.86-1.91 1.63a7.2 7.2 0 0 1 0 3.24l1.91 1.63-1.65 2.86-2.37-.84a7.2 7.2 0 0 1-2.8 1.62l-.46 2.47h-3.3l-.46-2.47a7.2 7.2 0 0 1-2.8-1.62l-2.37.84-1.65-2.86 1.91-1.63a7.2 7.2 0 0 1 0-3.24L3.07 8.75l1.65-2.86 2.37.84a7.2 7.2 0 0 1 2.8-1.62z"
      />
      <path data-part="hub" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </AnimatedGlyph>
  );
}
