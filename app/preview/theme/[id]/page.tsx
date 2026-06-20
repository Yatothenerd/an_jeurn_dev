import { notFound } from "next/navigation";
import { ThemeService } from "@/lib/services/theme.service";
import { PreviewOverlay } from "./PreviewClient";

// ─── Local types (mirrors wizard types without importing client component) ───
interface DetailItem { icon: string; label: string; value: string }
interface PhotoDetailItem { imageUrl: string; caption: string }

type SectionType = "cover" | "countdown" | "details" | "gallery" | "video" | "wishing" | "khqr";

interface WizardSection {
  type: SectionType;
  included: boolean;
  content: Record<string, unknown>;
}

interface ColorScheme { text: string; accent: string }

interface OverlayConfig {
  style: "floating" | "bottomBar";
  map:    { enabled: boolean };
  music:  { enabled: boolean };
  goToTop:{ enabled: boolean };
  gifts:  { enabled: boolean };
  colorScheme?: ColorScheme;
}

const SECTION_META: Record<SectionType, { label: string; icon: string }> = {
  cover:     { label: "Cover",           icon: "◈" },
  countdown: { label: "Countdown",       icon: "⏱" },
  details:   { label: "Agenda & Details",icon: "📋" },
  gallery:   { label: "Gallery",         icon: "🖼" },
  video:     { label: "Video",           icon: "▶" },
  wishing:   { label: "Wishing Well",    icon: "✨" },
  khqr:      { label: "KHQR Payment",    icon: "💳" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseSections(raw: unknown): WizardSection[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] !== "object" || raw[0] === null) return [];
  return raw as WizardSection[];
}

function parseOverlay(raw: unknown): OverlayConfig | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as OverlayConfig;
}

function getCoverSection(sections: WizardSection[]) {
  return sections.find(s => s.type === "cover");
}

function isFullBleedSection(sec: WizardSection, ct: string): boolean {
  if (ct !== "photo" || sec.type !== "details") return false;
  return ((sec.content.photoItems as unknown[]) ?? []).length > 0;
}

// ─── Section renderers ────────────────────────────────────────────────────────
function renderSection(sec: WizardSection, contentType = "text") {
  const c = sec.content;
  switch (sec.type) {
    case "cover":
      return (
        <div>
          {!!c.imageUrl && (
            <img
              src={c.imageUrl as string}
              alt="Cover"
              style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12, marginBottom: "1rem" }}
            />
          )}
          <h1 style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "0.1em", margin: "0 0 0.5rem", lineHeight: 1.2 }}>
            {(c.heading as string) || "Your Event"}
          </h1>
          <p style={{ fontSize: "1rem", opacity: 0.75, margin: 0 }}>
            {(c.subheading as string) || "Join us for something special"}
          </p>
        </div>
      );

    case "countdown":
      return (
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          {["00", "00", "00", "00"].map((v, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: "0.625rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {["Days", "Hours", "Mins", "Secs"][i]}
              </div>
            </div>
          ))}
        </div>
      );

    case "details": {
      const photoItems = (c.photoItems as PhotoDetailItem[] | undefined) ?? [];
      const textItems  = (c.items as DetailItem[] | undefined) ?? [];

      if (photoItems.length > 0) {
        if (contentType === "photo") {
          return (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
              {photoItems.map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)" }}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.caption} style={{ width: "100%", display: "block" }} />
                    : <div style={{ width: "100%", paddingTop: "66.67%", background: "rgba(255,255,255,0.06)", position: "relative" as const }}>
                        <div style={{ position: "absolute" as const, inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", opacity: 0.3 }}>🖼</div>
                      </div>
                  }
                  {item.caption && (
                    <div style={{ padding: "0.75rem 1.25rem", fontSize: "0.9375rem", opacity: 0.9 }}>{item.caption}</div>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {photoItems.map((item, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.caption} style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                  : <div style={{ width: "100%", height: 100, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>🖼</div>
                }
                {item.caption && (
                  <div style={{ padding: "0.5rem", fontSize: "0.8125rem", opacity: 0.85 }}>{item.caption}</div>
                )}
              </div>
            ))}
          </div>
        );
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {textItems.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.625rem 0.875rem" }}>
              <span style={{ fontSize: "1.25rem" }}>{item.icon || "📌"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.6875rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                <div style={{ fontSize: "0.9375rem", marginTop: 2 }}>{item.value || "—"}</div>
              </div>
            </div>
          ))}
          {textItems.length === 0 && (
            <p style={{ opacity: 0.5, fontSize: "0.875rem", textAlign: "center", margin: 0 }}>Details to be added</p>
          )}
        </div>
      );
    }

    case "gallery":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.25rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ paddingTop: "100%", background: "rgba(255,255,255,0.08)", borderRadius: 4, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", opacity: 0.3 }}>🖼</div>
            </div>
          ))}
        </div>
      );

    case "video":
      return (
        <div style={{ borderRadius: 12, overflow: "hidden", background: "rgba(0,0,0,0.4)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {c.thumbnailUrl
            ? <img src={c.thumbnailUrl as string} alt="Video thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem" }}>▶</div>
                <div style={{ fontSize: "0.875rem", opacity: 0.6, marginTop: "0.5rem" }}>{(c.caption as string) || "Watch our story"}</div>
              </div>
          }
          {!!c.thumbnailUrl && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>▶</div>
            </div>
          )}
        </div>
      );

    case "wishing":
      return (
        <div style={{ position: "relative" }}>
          {!!c.backgroundImageUrl && (
            <img
              src={c.backgroundImageUrl as string}
              alt="Background"
              style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, marginBottom: "0.75rem" }}
            />
          )}
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.875rem", opacity: 0.6, fontStyle: "italic" }}>
            {(c.placeholder as string) || "Leave us a sweet message…"}
          </div>
          <button style={{ marginTop: "0.75rem", width: "100%", padding: "0.625rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "inherit", cursor: "pointer", fontSize: "0.9375rem" }}>
            Send a wish ✨
          </button>
        </div>
      );

    case "khqr":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.875rem" }}>
          {c.qrImageUrl
            ? <img src={c.qrImageUrl as string} alt="QR Code" style={{ width: 160, height: 160, objectFit: "contain", borderRadius: 8, background: "#fff", padding: 8 }} />
            : (
              <div style={{ width: 160, height: 160, background: "rgba(255,255,255,0.9)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#333" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>💳</div>
                  <div>KHQR Code</div>
                </div>
              </div>
            )
          }
          {(c.recipientName as string) && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600, fontSize: "1rem" }}>{c.recipientName as string}</div>
              {(c.amount as string) && (
                <div style={{ fontSize: "0.875rem", opacity: 0.7, marginTop: "0.25rem" }}>
                  {c.amount as string} {(c.currency as string) || "KHR"}
                </div>
              )}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ThemePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const theme = await ThemeService.getById(id);
  if (!theme) notFound();

  const sections    = parseSections(theme.defaultSections);
  const overlay     = parseOverlay(theme.overlayConfig);
  const cover       = getCoverSection(sections);
  const rest        = sections.filter(s => s.included && s.type !== "cover");
  const contentType = (theme.contentType as string) ?? "text";

  const hasBg           = !!(theme.backgroundUrl || theme.backgroundVideoUrl);
  const showDarkOverlay = !(contentType === "photo" && !theme.backgroundVideoUrl);
  const textColor       = overlay?.colorScheme?.text   ?? "#ffffff";
  const accentColor     = overlay?.colorScheme?.accent ?? "#c9a96e";

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: textColor,
        overflowX: "hidden",
        background: hasBg ? undefined : "linear-gradient(160deg, #1a0e2e 0%, #0d1a2e 50%, #1a1200 100%)",
      }}
    >
      {/* ── Background ── */}
      {hasBg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          {theme.backgroundVideoUrl ? (
            <video
              src={theme.backgroundVideoUrl}
              autoPlay muted loop playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img src={theme.backgroundUrl!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {showDarkOverlay && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)" }} />
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Cover section — full viewport height */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "72px 28px 56px",
            textAlign: "center",
          }}
        >
          {theme.coverUrl && (
            <img
              src={theme.coverUrl}
              alt="Cover"
              style={{
                width: 110,
                height: 110,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid rgba(255,255,255,0.35)",
                marginBottom: "1.5rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            />
          )}

          {cover?.included && renderSection(cover)}

          {!cover?.included && (
            <>
              <h1 style={{ fontSize: "2rem", fontWeight: 300, letterSpacing: "0.12em", margin: "0 0 0.75rem" }}>
                {theme.name}
              </h1>
              <p style={{ fontSize: "0.9375rem", opacity: 0.7, margin: 0 }}>An invitation</p>
            </>
          )}

          {/* Decorative divider */}
          <div style={{ marginTop: "auto", paddingTop: "2.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", opacity: 0.45 }}>
            <div style={{ width: 1, height: 52, background: "currentColor" }} />
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>scroll</span>
          </div>
        </section>

        {/* Other sections */}
        {rest.map(sec => {
          const fullBleed = isFullBleedSection(sec, contentType);
          return (
            <section
              key={sec.type}
              style={{
                padding: fullBleed ? "0" : "52px 28px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(2px)",
              }}
            >
              {fullBleed ? (
                <>
                  <div style={{ textAlign: "center", padding: "2.5rem 28px 1.25rem" }}>
                    <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{SECTION_META[sec.type].icon}</div>
                    <h2 style={{ fontSize: "0.75rem", fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6, margin: 0, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                      {SECTION_META[sec.type].label}
                    </h2>
                  </div>
                  {renderSection(sec, contentType)}
                </>
              ) : (
                <div style={{ maxWidth: 420, margin: "0 auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{SECTION_META[sec.type].icon}</div>
                    <h2 style={{ fontSize: "0.75rem", fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6, margin: 0, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                      {SECTION_META[sec.type].label}
                    </h2>
                  </div>
                  {renderSection(sec, contentType)}
                </div>
              )}
            </section>
          );
        })}

        {/* Footer */}
        <div style={{
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          opacity: 0.35,
          fontSize: "0.6875rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}>
          Made with Anjeurn
        </div>
      </div>

      <PreviewOverlay
        overlay={overlay}
        musicUrl={theme.musicUrl}
        accentColor={accentColor}
        textColor={textColor}
      />
    </div>
  );
}
