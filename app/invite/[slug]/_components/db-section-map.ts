// Plain (server-evaluable) module that assembles the DB section renderer map.
//
// IMPORTANT: this file must NOT carry a "use client" directive. The map is a
// plain object of client-component references. If it were exported from a
// "use client" module, a Server Component importing it would receive an opaque
// client-reference proxy whose own keys are empty — so `{ ...DB_SECTIONS }`
// would spread to nothing and the standard renderers would silently win.
// Defining the object here (server side) keeps it a real, spreadable object.

import type { SectionComponents } from "@/lib/themes/types";
import {
  DbCoverSection,
  DbCountdownSection,
  DbDetailsSection,
  DbGallerySection,
  DbVideoSection,
  DbWishingSection,
  DbKhqrSection,
} from "./DbThemeSections";

export const DB_SECTIONS: SectionComponents = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cover: DbCoverSection as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countdown: DbCountdownSection as any,
  // "agenda" (legacy InvitationSection type) and "details" (wizard type) share the same renderer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agenda: DbDetailsSection as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: DbDetailsSection as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gallery: DbGallerySection as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  video: DbVideoSection as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wishing: DbWishingSection as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  khqr: DbKhqrSection as any,
};
