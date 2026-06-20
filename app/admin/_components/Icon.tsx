// Theme-aware icon: renders an SVG from /public/icons as a CSS mask filled with
// currentColor, so it inherits text color and adapts to dark/light automatically
// (the source SVGs have hardcoded fills, which a mask ignores — only the shape
// matters). Usage: <Icon name="dashboard" />
export function Icon({ name, size = 20 }: { name: string; size?: number | string }) {
  const url = `url(/icons/${name}.svg)`;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: "currentColor",
        maskImage: url,
        WebkitMaskImage: url,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
