export default function Loading() {
  return (
    <div>
      <div style={{ ...s.sk, width: 180, height: 28, marginBottom: "1.5rem" }} />
      <div style={s.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={s.card}>
            <div style={{ ...s.sk, width: "50%", height: 34 }} />
            <div style={{ ...s.sk, width: "70%", height: 12, marginTop: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" },
  card: { background: "#fff", borderRadius: 10, padding: "1.5rem", border: "1px solid #e5e7eb" },
  sk: {
    background: "linear-gradient(90deg,#eef2f7 25%,#e2e8f0 37%,#eef2f7 63%)",
    backgroundSize: "400% 100%",
    borderRadius: 6,
    animation: "anjeurnShimmer 1.4s ease infinite",
  },
} as const;
