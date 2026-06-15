"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeTab } from "./ThemeTab";
import { SectionsTab } from "./SectionsTab";
import { PhotosTab } from "./PhotosTab";
import { MusicTab } from "./MusicTab";
import { SettingsTab } from "./SettingsTab";

export interface BuilderSection {
  id: string;
  type: string;
  content: unknown;
  sortOrder: number;
}

export interface BuilderPhoto {
  id: string;
  url: string;
  sortOrder: number;
}

export interface BuilderTheme {
  id: string;
  name: string;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  isAnimated: boolean;
}

export interface BuilderPkg {
  maxSections: number;
  maxPhotos: number;
  hasMusic: boolean;
  hasVideo: boolean;
  hasKhqr: boolean;
  hasWishing: boolean;
  hasHosting: boolean;
  galleryType: string | null;
}

interface Props {
  eventId: string;
  eventTitle: string;
  invitationId: string;
  currentThemeId: string;
  shareLink: string | null;
  isPublished: boolean;
  showWatermark: boolean;
  musicUrl: string | null;
  sections: BuilderSection[];
  photos: BuilderPhoto[];
  allowedThemes: BuilderTheme[];
  pkg: BuilderPkg | null;
}

type Tab = "theme" | "sections" | "photos" | "music" | "settings";

const ALL_TABS: Array<{ id: Tab; label: string }> = [
  { id: "theme", label: "Theme" },
  { id: "sections", label: "Sections" },
  { id: "photos", label: "Photos" },
  { id: "music", label: "Music" },
  { id: "settings", label: "Settings" },
];

export function BuilderClient(props: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("theme");

  const visibleTabs = ALL_TABS.filter((t) => {
    if (t.id === "music") return props.pkg?.hasMusic ?? false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <Link href="/dashboard" style={s.backLink}>← Events</Link>
          <h1 style={s.title}>{props.eventTitle}</h1>
        </div>
        <div style={s.headerRight}>
          {props.isPublished && props.shareLink && (
            <a href={props.shareLink} target="_blank" rel="noreferrer" style={s.viewBtn}>
              View Live ↗
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={s.content}>
        {activeTab === "theme" && (
          <ThemeTab
            invitationId={props.invitationId}
            currentThemeId={props.currentThemeId}
            allowedThemes={props.allowedThemes}
          />
        )}
        {activeTab === "sections" && (
          <SectionsTab
            invitationId={props.invitationId}
            sections={props.sections}
            pkg={props.pkg}
          />
        )}
        {activeTab === "photos" && (
          <PhotosTab
            invitationId={props.invitationId}
            photos={props.photos}
            maxPhotos={props.pkg?.maxPhotos ?? 0}
            galleryType={props.pkg?.galleryType ?? null}
          />
        )}
        {activeTab === "music" && props.pkg?.hasMusic && (
          <MusicTab
            invitationId={props.invitationId}
            currentMusicUrl={props.musicUrl}
          />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            invitationId={props.invitationId}
            shareLink={props.shareLink}
            isPublished={props.isPublished}
            showWatermark={props.showWatermark}
            hasHosting={props.pkg?.hasHosting ?? false}
          />
        )}
      </div>
    </div>
  );
}

const s = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.25rem",
  },
  headerLeft: { display: "flex", flexDirection: "column" as const, gap: "0.25rem" },
  backLink: { color: "#64748b", textDecoration: "none", fontSize: "0.8125rem" },
  title: { margin: 0, fontSize: "1.375rem", fontWeight: 700, color: "#0f172a" },
  headerRight: { display: "flex", gap: "0.75rem", alignItems: "center" },
  viewBtn: {
    padding: "0.4rem 0.875rem",
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.8125rem",
    fontWeight: 600,
  },
  tabs: {
    display: "flex",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "1.5rem",
    gap: "0",
  },
  tab: {
    padding: "0.625rem 1.125rem",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#64748b",
    transition: "color 0.15s, border-color 0.15s",
  },
  tabActive: { color: "#7c3aed", borderBottomColor: "#7c3aed" },
  content: { minHeight: "400px" },
} as const;
