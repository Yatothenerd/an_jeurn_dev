export default function Loading() {
  return (
    <div>
      <div style={{ ...s.sk, width: 80, height: 12 }} />
      <div style={{ ...s.sk, width: 220, height: 26, marginTop: 8 }} />
      <div style={s.tabs}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ ...s.sk, width: 70, height: 16 }} />
        ))}
      </div>
      <div style={s.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ ...s.sk, height: 160, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

const s = {
  tabs: { display: "flex", gap: "1.25rem", borderBottom: "2px solid #e2e8f0", padding: "1.25rem 0 0.75rem", margin: "1.25rem 0 1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.875rem" },
  sk: {
    background: "linear-gradient(90deg,#eef2f7 25%,#e2e8f0 37%,#eef2f7 63%)",
    backgroundSize: "400% 100%",
    borderRadius: 6,
    animation: "anjeurnShimmer 1.4s ease infinite",
  },
} as const;
