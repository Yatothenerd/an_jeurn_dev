export type { User, Package, Theme, PackageTheme, UserPackage, Event, Invitation, Section, Photo, Guest } from "../app/generated/prisma";
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

// Package with themes
export interface PackageWithThemes extends Package {
  packageThemes: Array<{
    theme: Theme;
  }>;
}

// Event with invitation
export interface EventWithInvitation extends Event {
  invitation: Invitation | null;
}

import type { Package, Theme, Invitation, Event } from "../app/generated/prisma";
