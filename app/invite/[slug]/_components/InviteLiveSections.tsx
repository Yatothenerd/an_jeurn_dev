"use client";

/**
 * InviteLiveSections — editor-only live preview (rendered only when ?preview=1).
 *
 * Renders the invite's content sections from local React state instead of the
 * server-rendered snapshot, and listens for `{type:"anjeurn:live-content",
 * sections}` postMessages from the parent ThemeEditor frame. Every keystroke in
 * the editor updates `sections` state there, which is relayed here immediately
 * (no debounce) — so text edits show up instantly, unsaved, with no iframe
 * reload. Saving to the DB still happens separately, debounced, in the editor.
 *
 * Falls back to the same STANDARD_SECTIONS/DB_SECTIONS/theme-section dispatch
 * the server page uses (see render-section.tsx) — kept in sync by construction
 * since both read from the same theme registry.
 */

import { useEffect, useState } from "react";
import type { InviteData } from "@/lib/utils/invite-cache";
import type { SectionType, ThemeTokens } from "@/lib/themes/types";
import { getTheme } from "@/lib/themes/registry";
import { DB_SECTIONS } from "./db-section-map";
import { STANDARD_SECTIONS, renderSection, makeAnchorId } from "./render-section";
import { RevealOnScroll, type SectionEffect } from "./RevealOnScroll";

interface Props {
  initialSections: InviteData["sections"];
  keepCoverAfterOpen: boolean;
  data: InviteData;
  tokens: ThemeTokens;
  themeId: string;
  themeAssets?: Record<string, string>;
  guestName: string | null;
  guests: Array<{ name: string; rsvpStatus: string | null }>;
  showGuestNames: boolean;
  sectionEffect: SectionEffect;
}

export function InviteLiveSections({
  initialSections,
  keepCoverAfterOpen,
  data,
  tokens,
  themeId,
  themeAssets,
  guestName,
  guests,
  showGuestNames,
  sectionEffect,
}: Props) {
  const [rawSections, setRawSections] = useState(initialSections);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; sections?: InviteData["sections"] } | null;
      if (d && d.type === "anjeurn:live-content" && Array.isArray(d.sections)) {
        setRawSections(d.sections);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const sections = keepCoverAfterOpen ? rawSections : rawSections.filter((s) => s.type !== "cover");

  const themeMod = getTheme(themeId);
  const components = { ...STANDARD_SECTIONS, ...DB_SECTIONS, ...(themeMod.sections ?? {}) };
  const layout = themeMod.layout ?? {};
  const anchorId = makeAnchorId();
  const effectFor = (sec: InviteData["sections"][number]): SectionEffect =>
    (sec.content as { _effect?: { entrance?: SectionEffect } } | null)?._effect?.entrance ?? sectionEffect;
  let altIndex = 0;

  return (
    <>
      {sections.map((sec) => {
        const node = renderSection(sec, { ...data, sections }, tokens, components, themeAssets, guestName, guests, showGuestNames);
        if (!node) return null;

        if (sec.type === "cover") {
          return (
            <div key={sec.id} id={anchorId("cover")}>
              <RevealOnScroll effect={effectFor(sec)}>
                {layout.wrapCover ? layout.wrapCover(node, tokens) : node}
              </RevealOnScroll>
            </div>
          );
        }

        const wrapped = layout.wrapSection
          ? layout.wrapSection(node, { type: sec.type as SectionType, index: altIndex, tokens })
          : node;
        altIndex++;

        return (
          <div key={sec.id} id={anchorId(sec.type)}>
            <RevealOnScroll effect={effectFor(sec)}>{wrapped}</RevealOnScroll>
          </div>
        );
      })}
    </>
  );
}
