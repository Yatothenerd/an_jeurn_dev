import { getThemeTokens } from "@/lib/themes/registry";
import type { ThemeTokens } from "@/lib/themes/types";

// The four representative swatches shown in the showcase palette.
function paletteOf(t: ThemeTokens): string[] {
  return t.family === "khmer"
    ? [t.bg, t.accent, t.btnBg, t.primary]
    : [t.bg, t.primary, t.accent, t.altBg];
}

export function ThemePalette({ themeId, size = 18 }: { themeId: string; size?: number }) {
  const t = getThemeTokens(themeId);
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {paletteOf(t).map((c, i) => (
        <span
          key={i}
          title={c}
          style={{
            width: size,
            height: size,
            background: c,
            display: "block",
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.12)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
          }}
        />
      ))}
    </div>
  );
}

// Live, data-driven mini-preview of a theme — rendered from the same design
// tokens the real invitation uses, so the picker always matches the result
// without needing any image assets.

export function ThemeThumbnail({ themeId }: { themeId: string }) {
  const t = getThemeTokens(themeId);

  if (t.family === "khmer") {
    return (
      <div style={{ ...box, background: t.coverGradient, color: t.accent, fontFamily: "Georgia, serif" }}>
        <div style={{ ...frame, borderColor: "rgba(212,175,55,0.5)" }} />
        <div style={{ ...frame, inset: 10, borderColor: "rgba(212,175,55,0.28)" }} />
        <div style={{ fontSize: 9, letterSpacing: "0.15em", color: t.accent, opacity: 0.9 }}>សូមគោរពអញ្ជើញ</div>
        <div style={{ fontSize: 20, color: "#fff", fontStyle: "italic", margin: "2px 0" }}>Royal Khmer</div>
        <div style={{ ...gemLine, color: t.accent }}>
          <i style={line} /><span style={{ fontSize: 8 }}>{t.gem}</span><i style={line} />
        </div>
        <div style={{ fontSize: 8, letterSpacing: "0.12em", color: t.accent, opacity: 0.85 }}>ពិធីមង្គលការ</div>
      </div>
    );
  }

  return (
    <div style={{ ...box, background: t.coverGradient, color: t.text, fontFamily: t.font.includes("Playfair") ? "Georgia, serif" : "Georgia, serif" }}>
      {(["tl", "tr", "bl", "br"] as const).map((p) => (
        <span key={p} style={{ ...corner(p), color: t.accent }} />
      ))}
      <div style={{ fontSize: 7, letterSpacing: "0.22em", textTransform: "uppercase", color: t.accent, opacity: 0.8 }}>
        Invitation
      </div>
      <div style={{ fontFamily: "'Great Vibes', cursive", fontSize: 24, color: t.primary, lineHeight: 1 }}>Sophea</div>
      <div style={{ fontSize: 11, fontStyle: "italic", color: t.accent, opacity: 0.6, margin: "-2px 0" }}>&amp;</div>
      <div style={{ fontFamily: "'Great Vibes', cursive", fontSize: 24, color: t.primary, lineHeight: 1 }}>Dara</div>
      <div style={{ ...gemLine, color: t.accent }}>
        <i style={line} /><span style={{ fontSize: 8 }}>{t.gem}</span><i style={line} />
      </div>
      <div style={{ fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase", color: t.accent, opacity: 0.85 }}>
        14 February 2026
      </div>
    </div>
  );
}

const box: React.CSSProperties = {
  width: "100%",
  height: "100%",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  padding: "10px 8px",
  textAlign: "center",
  overflow: "hidden",
};

const frame: React.CSSProperties = { position: "absolute", inset: 6, border: "1px solid", pointerEvents: "none" };

const gemLine: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, width: "60%", margin: "1px 0" };
const line: React.CSSProperties = { flex: 1, height: 1, background: "currentColor", opacity: 0.3, display: "block" };

function corner(pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", width: 12, height: 12, opacity: 0.4 };
  const b = "1px solid currentColor";
  if (pos === "tl") return { ...base, top: 8, left: 8, borderTop: b, borderLeft: b };
  if (pos === "tr") return { ...base, top: 8, right: 8, borderTop: b, borderRight: b };
  if (pos === "bl") return { ...base, bottom: 8, left: 8, borderBottom: b, borderLeft: b };
  return { ...base, bottom: 8, right: 8, borderBottom: b, borderRight: b };
}
