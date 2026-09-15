import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

const swing = [0, 15, -12, 8, -4, 1.5, 0].map((deg) => ({ transform: `rotate(${deg}deg)`, easing: "ease-in-out" }));

/** The bell swings from its crown; the clapper follows a beat later. */
const motion: IconMotion = {
  steps: [
    { part: "bell", keyframes: swing, origin: "12px 5px", duration: 900, easing: "linear" },
    { part: "clapper", keyframes: swing, origin: "12px 5px", duration: 900, delay: 70, easing: "linear" },
  ],
  pause: 1800,
};

export function IconBellAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="bell" d="M17.44 8.46A6 6 0 0 1 18 11v5l1.5 2.5h-15L6 16v-5a6 6 0 0 1 8.54-5.44" />
      <path data-part="clapper" d="M10.25 20.75a2 2 0 0 0 3.5 0" />
    </AnimatedGlyph>
  );
}
