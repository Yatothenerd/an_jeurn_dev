export default function Loading() {
  return (
    <div>
      <div style={s.header}>
        <div style={{ ...s.sk, width: 160, height: 28 }} />
        <div style={{ ...s.sk, width: 120, height: 36, borderRadius: 8 }} />
      </div>
      <div style={s.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={s.card}>
            <div style={{ ...s.sk, width: "40%", height: 12 }} />
            <div style={{ ...s.sk, width: "75%", height: 18, marginTop: 10 }} />
            <div style={{ ...s.sk, width: "55%", height: 12, marginTop: 8 }} />
            <div style={{ ...s.sk, width: "100%", height: 34, marginTop: 18, borderRadius: 7 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" },
  card: { background: "var(--c-surface)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--c-border)" },
  sk: {
    background: "linear-gradient(90deg,var(--c-surface-2) 25%,var(--c-border) 37%,var(--c-surface-2) 63%)",
    backgroundSize: "400% 100%",
    borderRadius: 6,
    animation: "anjeurnShimmer 1.4s ease infinite",
  },
} as const;
