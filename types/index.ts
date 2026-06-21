export type { User, Package, UserPackage, Event, Invitation, Section, Photo, Guest, Wish } from "../app/generated/prisma";
export { Role, GuestControlType, UserPackageStatus, ContactType } from "../app/generated/prisma";

// Auth
export interface JwtPayload {
  sub: string;
  email: string;
  role: "admin" | "client";
  iat?: number;
  exp?: number;
}

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "client";
  };
  token: string;
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Event with invitation
export interface EventWithInvitation extends Event {
  invitation: Invitation | null;
}

// Legacy stubs — Theme/PackageTheme models removed from Prisma schema.
// These interfaces keep existing component files compiling during cleanup.
export interface Theme {
  id: string;
  name: string;
  contentType: string | null;
  defaultSections: unknown;
  overlayConfig: unknown;
  backgroundUrl: string | null;
  backgroundVideoUrl: string | null;
  coverUrl: string | null;
  musicUrl: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  isAnimated: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PackageTheme {
  packageId: string;
  themeId: string;
  theme?: Theme;
}

export interface PackageWithThemes extends Package {
  packageThemes: Array<{ theme: Theme }>;
}

import type { Invitation, Event, Package } from "../app/generated/prisma";
