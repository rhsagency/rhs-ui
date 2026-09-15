import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** A product drops into the basket, the cart dips under it, and the product settles out of view. */
const motion: IconMotion = {
  steps: [
    {
      part: "item",
      duration: 900,
      easing: "linear",
      keyframes: [
        { transform: "translateY(-3px)", opacity: 0, easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
        { offset: 0.15, opacity: 1 },
        { offset: 0.5, transform: "translateY(6px)", opacity: 1 },
        { offset: 0.78, transform: "translateY(6px)", opacity: 1, easing: "ease-in" },
        { transform: "translateY(6px)", opacity: 0 },
      ],
    },
    {
      part: "cart",
      duration: 900,
      easing: "linear",
      keyframes: [
        { transform: "translateY(0)" },
        { offset: 0.48, transform: "translateY(0)", easing: "ease-out" },
        { offset: 0.58, transform: "translateY(1.2px)", easing: "ease-in-out" },
        { offset: 0.78, transform: "translateY(0)" },
        { transform: "translateY(0)" },
      ],
    },
  ],
  pause: 1400,
};

export function IconCartAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="item" opacity={0} d="M12 2.5h4v4h-4z" />
      <path data-part="cart" d="M3 4h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6.3" />
      <path data-part="cart" d="M10 20.5h.01M17 20.5h.01" />
    </AnimatedGlyph>
  );
}
