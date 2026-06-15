export function Watermark() {
  return (
    <a
      href="https://anjeurn.com"
      target="_blank"
      rel="noreferrer"
      style={s.watermark}
    >
      Made with Anjeurn
    </a>
  );
}

const s = {
  watermark: {
    position: "fixed" as const,
    top: "0.875rem",
    right: "0.875rem",
    padding: "0.25rem 0.625rem",
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    borderRadius: "999px",
    fontSize: "0.6875rem",
    textDecoration: "none",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.02em",
    zIndex: 50,
    backdropFilter: "blur(4px)",
  },
} as const;
