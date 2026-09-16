import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** Three dots type inside the bubble, then leave it empty again. */
const dot = (delay: number) => ({
  part: `dot-${delay}`,
  duration: 900,
  delay,
  easing: "linear",
  keyframes: [
    { transform: "translateY(0)", opacity: 0, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    { offset: 0.2, transform: "translateY(-1.6px)", opacity: 1, easing: "ease-in-out" },
    { offset: 0.45, transform: "translateY(0)", opacity: 1 },
    { offset: 0.75, transform: "translateY(0)", opacity: 1, easing: "ease-in" },
    { transform: "translateY(0)", opacity: 0 },
  ],
});

const motion: IconMotion = { steps: [dot(0), dot(110), dot(220)], pause: 700 };

export function IconMessageAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="bubble" d="M17.8 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3v3.5l4.5-3.5H19a2 2 0 0 0 2-2V7.2" />
      <path data-part="dot-0" opacity={0} d="M8.5 11h.01" />
      <path data-part="dot-110" opacity={0} d="M12 11h.01" />
      <path data-part="dot-220" opacity={0} d="M15.5 11h.01" />
    </AnimatedGlyph>
  );
}
