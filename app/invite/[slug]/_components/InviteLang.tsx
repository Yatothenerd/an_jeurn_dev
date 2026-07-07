"use client";

/**
 * Bilingual invitation support.
 *
 * The admin writes base content in the primary language and alternate text in
 * each section's `content.i18n` object (same field shape). Guests flip the
 * whole invitation with the floating toggle; every DB section re-reads its
 * content through `useLangContent`, so the switch is instant (no reload).
 */

import { createContext, useContext, useState } from "react";

export type InviteLangKey = "primary" | "secondary";

const LangCtx = createContext<InviteLangKey>("primary");

export function useInviteLang(): InviteLangKey {
  return useContext(LangCtx);
}

/** Merge a section's `content.i18n` overrides when the secondary language is active. */
export function useLangContent<T extends object>(content: T): T {
  const lang = useInviteLang();
  const alt = (content as { i18n?: Partial<T> }).i18n;
  if (lang === "secondary" && alt && typeof alt === "object") {
    return { ...content, ...alt };
  }
  return content;
}

export function InviteLangProvider({
  enabled,
  primaryLabel,
  secondaryLabel,
  children,
}: {
  enabled: boolean;
  primaryLabel: string;
  secondaryLabel: string;
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<InviteLangKey>("primary");

  if (!enabled) return <>{children}</>;

  return (
    <LangCtx.Provider value={lang}>
      {children}
      {/* Floating language toggle — pinned to the top of the invite card */}
      <div className="inv-lang-wrap">
        <div className="inv-lang-toggle" role="group" aria-label="Language">
          <button
            type="button"
            className={`inv-lang-btn${lang === "primary" ? " on" : ""}`}
            onClick={() => setLang("primary")}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className={`inv-lang-btn${lang === "secondary" ? " on" : ""}`}
            onClick={() => setLang("secondary")}
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </LangCtx.Provider>
  );
}
